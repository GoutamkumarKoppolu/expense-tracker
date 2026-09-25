package com.goutam.expensetracker;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * Opens a file from the app's cache in whichever app views that type (a PDF
 * reader, the gallery), the way "Open with" works elsewhere on Android.
 *
 * The file must be in the cache folder (Filesystem Directory.Cache), which
 * the FileProvider in AndroidManifest.xml exposes via res/xml/file_paths.xml.
 *
 * JS: registerPlugin("FileViewer").open({ path: "file:///…", mimeType: "application/pdf" })
 * Rejects with code "NO_APP" when nothing on the phone can open the type.
 */
@CapacitorPlugin(name = "FileViewer")
public class FileViewerPlugin extends Plugin {

    @PluginMethod
    public void open(PluginCall call) {
        String path = call.getString("path");
        String mimeType = call.getString("mimeType", "*/*");
        if (path == null || path.isEmpty()) {
            call.reject("path is required");
            return;
        }

        try {
            String filePath = path.startsWith("file:") ? Uri.parse(path).getPath() : path;
            File file = new File(filePath);
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("No app can open this file", "NO_APP");
        } catch (IllegalArgumentException e) {
            call.reject("This file can't be opened", e);
        }
    }
}
