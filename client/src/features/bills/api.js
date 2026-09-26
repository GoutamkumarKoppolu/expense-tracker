// Bill data access. Files are stored as Blobs in IndexedDB, exactly as
// uploaded; nothing here reads what's inside them.
import { db } from "../../db";
import { requireNonEmpty } from "../../db/validators";
import { checkFile, nextPositions, sameName } from "./domain";
import { makeThumbnail } from "./thumbnail";

const nowIso = () => new Date().toISOString();

export async function fetchBillsData() {
  const [folders, bills, pages] = await Promise.all([db.bill_folders.toArray(), db.bills.toArray(), db.bill_pages.toArray()]);
  return { folders, bills, pages };
}

async function assertUniqueFolder(name, exceptId = null) {
  const clash = (await db.bill_folders.toArray()).find((f) => f.id !== exceptId && sameName(f.name, name));
  if (clash) throw new Error(`A folder called "${clash.name}" already exists`);
}

async function getFolder(id) {
  const folder = await db.bill_folders.get(Number(id));
  if (!folder) throw new Error("Folder not found");
  return folder;
}

async function getBill(id) {
  const bill = await db.bills.get(Number(id));
  if (!bill) throw new Error("Bill not found");
  return bill;
}

export async function createFolder(name) {
  const clean = requireNonEmpty(name, "folder name");
  await assertUniqueFolder(clean);
  const id = await db.bill_folders.add({ name: clean, created_at: nowIso() });
  return db.bill_folders.get(id);
}

export async function renameFolder(id, name) {
  const folder = await getFolder(id);
  const clean = requireNonEmpty(name, "folder name");
  await assertUniqueFolder(clean, folder.id);
  await db.bill_folders.update(folder.id, { name: clean });
  return db.bill_folders.get(folder.id);
}

// Deletes the folder with every bill and file in it.
export async function deleteFolder(id) {
  const folder = await getFolder(id);
  await db.transaction("rw", db.bill_folders, db.bills, db.bill_pages, async () => {
    const billIds = await db.bills.where("folder_id").equals(folder.id).primaryKeys();
    await db.bill_pages.where("bill_id").anyOf(billIds).delete();
    await db.bills.bulkDelete(billIds);
    await db.bill_folders.delete(folder.id);
  });
  return null;
}

// Reads files into page rows. Previews are made before any database
// transaction starts: IndexedDB transactions close if they wait on other work.
async function toPages(files, positions) {
  if (!files.length) throw new Error("Add at least one photo or PDF");
  files.forEach(checkFile);
  const pages = [];
  for (const [i, file] of files.entries()) {
    pages.push({
      position: positions[i],
      name: file.name || `page-${i + 1}`,
      type: file.type,
      size: file.size,
      data: file.slice(0, file.size, file.type), // a plain Blob, not a File
      thumb: await makeThumbnail(file),
      created_at: nowIso(),
    });
  }
  return pages;
}

// Saves one bill per file, all or nothing.
// data: { items: [{ name, file }], folderId } or { items, newFolderName }.
export async function createBills(data) {
  const items = data.items || [];
  if (!items.length) throw new Error("Add at least one photo or PDF");
  const names = items.map((it) => requireNonEmpty(it.name, "bill name"));
  const newFolderName = data.newFolderName?.trim();
  if (newFolderName) await assertUniqueFolder(newFolderName);
  else await getFolder(data.folderId);
  const pages = [];
  for (const it of items) pages.push(...(await toPages([it.file], [0])));

  const billIds = [];
  await db.transaction("rw", db.bill_folders, db.bills, db.bill_pages, async () => {
    const folderId = newFolderName
      ? await db.bill_folders.add({ name: newFolderName, created_at: nowIso() })
      : Number(data.folderId);
    for (const [i, name] of names.entries()) {
      const billId = await db.bills.add({ folder_id: folderId, name, created_at: nowIso() });
      await db.bill_pages.add({ ...pages[i], bill_id: billId });
      billIds.push(billId);
    }
  });
  return db.bills.bulkGet(billIds);
}

// Renames a bill and/or moves it to another folder.
export async function updateBill(id, data) {
  const bill = await getBill(id);
  const name = requireNonEmpty(data.name, "bill name");
  const folder = await getFolder(data.folderId ?? bill.folder_id);
  await db.bills.update(bill.id, { name, folder_id: folder.id });
  return db.bills.get(bill.id);
}

export async function deleteBill(id) {
  const bill = await getBill(id);
  await db.transaction("rw", db.bills, db.bill_pages, async () => {
    await db.bill_pages.where("bill_id").equals(bill.id).delete();
    await db.bills.delete(bill.id);
  });
  return null;
}

export async function addPages(billId, files) {
  const bill = await getBill(billId);
  const existing = await db.bill_pages.where("bill_id").equals(bill.id).toArray();
  const pages = await toPages(files, nextPositions(existing, files.length));
  await db.bill_pages.bulkAdd(pages.map((p) => ({ ...p, bill_id: bill.id })));
  return null;
}

// A bill always keeps at least one page; delete the bill to remove the last.
export async function deletePage(pageId) {
  const page = await db.bill_pages.get(Number(pageId));
  if (!page) throw new Error("Page not found");
  if ((await db.bill_pages.where("bill_id").equals(page.bill_id).count()) <= 1) {
    throw new Error("This is the bill's only page. Delete the bill instead.");
  }
  await db.bill_pages.delete(page.id);
  return null;
}
