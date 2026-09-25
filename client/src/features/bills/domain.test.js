import { describe, expect, it } from "vitest";
import {
  MAX_FILE_BYTES,
  checkFile,
  defaultBillName,
  nextPositions,
  pageKind,
  searchBills,
  summarizeBills,
  summarizeFolders,
} from "./domain";

const folders = [
  { id: 1, name: "warranties", created_at: "2026-09-01T00:00:00.000Z" },
  { id: 2, name: "Electricity", created_at: "2026-09-02T00:00:00.000Z" },
  { id: 3, name: "Empty", created_at: "2026-09-03T00:00:00.000Z" },
];
const bills = [
  { id: 10, folder_id: 1, name: "Fridge invoice", created_at: "2026-09-10T00:00:00.000Z" },
  { id: 11, folder_id: 1, name: "TV warranty", created_at: "2026-09-12T00:00:00.000Z" },
  { id: 12, folder_id: 2, name: "August bill", created_at: "2026-09-05T00:00:00.000Z" },
];
const thumb = { fake: "thumb" };
const pages = [
  { id: 100, bill_id: 10, position: 1, type: "image/jpeg", size: 300, thumb },
  { id: 101, bill_id: 10, position: 0, type: "image/jpeg", size: 200, thumb },
  { id: 102, bill_id: 11, position: 0, type: "application/pdf", size: 1000, thumb: null },
  { id: 103, bill_id: 12, position: 0, type: "application/pdf", size: 50, thumb: null },
];

describe("files", () => {
  it("accepts photos and PDFs only", () => {
    expect(pageKind("image/png")).toBe("image");
    expect(pageKind("application/pdf")).toBe("pdf");
    expect(pageKind("text/plain")).toBeNull();
    expect(pageKind(undefined)).toBeNull();
  });

  it("rejects unsupported, empty and oversized files with the file's name", () => {
    expect(() => checkFile({ name: "a.jpg", type: "image/jpeg", size: 10 })).not.toThrow();
    expect(() => checkFile({ name: "notes.txt", type: "text/plain", size: 10 })).toThrow(/"notes.txt" isn't a photo or a PDF/);
    expect(() => checkFile({ name: "a.pdf", type: "application/pdf", size: 0 })).toThrow(/empty/);
    expect(() => checkFile({ name: "big.pdf", type: "application/pdf", size: MAX_FILE_BYTES + 1 })).toThrow(/over 50 MB/);
  });

  it("names a bill after its first file", () => {
    expect(defaultBillName("IMG_2026_fridge.jpg")).toBe("IMG 2026 fridge");
    expect(defaultBillName("Invoice March.pdf")).toBe("Invoice March");
    expect(defaultBillName(".pdf")).toBe("Bill");
    expect(defaultBillName(undefined)).toBe("Bill");
  });

  it("appends pages after the existing ones", () => {
    expect(nextPositions([], 2)).toEqual([0, 1]);
    expect(nextPositions([{ position: 0 }, { position: 4 }], 2)).toEqual([5, 6]);
  });
});

describe("summaries", () => {
  const summaries = summarizeBills(bills, pages);

  it("orders bills newest first, pages by position, and totals sizes", () => {
    expect(summaries.map((b) => b.id)).toEqual([11, 10, 12]);
    const fridge = summaries.find((b) => b.id === 10);
    expect(fridge.pages.map((p) => p.id)).toEqual([101, 100]);
    expect(fridge).toMatchObject({ pageCount: 2, size: 500 });
    expect(fridge.cover.id).toBe(101);
  });

  it("uses the first page as cover when nothing has a preview", () => {
    expect(summaries.find((b) => b.id === 11).cover.id).toBe(102);
  });

  it("summarizes folders A→Z with counts, size and a photo cover", () => {
    const result = summarizeFolders(folders, summaries);
    expect(result.map((f) => f.name)).toEqual(["Electricity", "Empty", "warranties"]);
    expect(result.find((f) => f.id === 1)).toMatchObject({ billCount: 2, size: 1500 });
    expect(result.find((f) => f.id === 1).cover.id).toBe(101);
    expect(result.find((f) => f.id === 2).cover).toBeNull();
    expect(result.find((f) => f.id === 3)).toMatchObject({ billCount: 0, size: 0, cover: null });
  });

  it("searches bill names and folder names", () => {
    expect(searchBills(summaries, folders, "tv").map((b) => b.id)).toEqual([11]);
    expect(searchBills(summaries, folders, "ELECTRIC").map((b) => b.id)).toEqual([12]);
    expect(searchBills(summaries, folders, "  ")).toHaveLength(3);
  });
});
