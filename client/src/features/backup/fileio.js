// Getting a file out of the app. In a browser that's a normal download; in
// the Android app downloads don't work inside the WebView, so the file is
// written to the app cache and handed to the share sheet (Drive, Files,
// WhatsApp, email…).
import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// Resolves to true when the file was saved/shared, false if the user
// cancelled the share sheet.
export async function saveTextFile(fileName, contents) {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: contents,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    try {
      await Share.share({ title: fileName, dialogTitle: "Save your backup", files: [uri] });
      return true;
    } catch (e) {
      if (/cancel/i.test(e?.message || "")) return false;
      throw e;
    }
  }

  const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
