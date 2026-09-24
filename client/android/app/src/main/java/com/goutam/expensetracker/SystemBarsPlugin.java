package com.goutam.expensetracker;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.View;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Keeps the status bar and navigation bar areas matching the web app's theme.
 *
 * The WebView is inset below the status bar and above the navigation bar
 * (capacitor.config.json: android.adjustMarginsForEdgeToEdge), so on
 * Android 15+ what shows through the transparent system bars is the window
 * background; on older versions the bars have their own color. Both are set
 * here, along with light/dark bar icons so they stay readable.
 *
 * JS: registerPlugin("SystemBars").setColors({ top, bottom, topDarkIcons, bottomDarkIcons })
 */
@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

    @PluginMethod
    public void setColors(PluginCall call) {
        final int top;
        final int bottom;
        try {
            top = Color.parseColor(call.getString("top", "#000000"));
            bottom = Color.parseColor(call.getString("bottom", "#000000"));
        } catch (IllegalArgumentException e) {
            call.reject("Invalid color");
            return;
        }
        final boolean topDarkIcons = call.getBoolean("topDarkIcons", false);
        final boolean bottomDarkIcons = call.getBoolean("bottomDarkIcons", false);

        getActivity()
            .runOnUiThread(() -> {
                Window window = getActivity().getWindow();
                View decor = window.getDecorView();

                // Android 15+: visible behind the transparent status (top) and navigation (bottom) bars.
                // The middle is covered by the WebView, so the gradient's blend is never seen.
                decor.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[] { top, bottom }));

                // Android 14 and below: the bars are opaque and use these colors.
                applyLegacyBarColors(window, top, bottom);

                WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decor);
                controller.setAppearanceLightStatusBars(topDarkIcons);
                controller.setAppearanceLightNavigationBars(bottomDarkIcons);

                call.resolve();
            });
    }

    @SuppressWarnings("deprecation")
    private static void applyLegacyBarColors(Window window, int top, int bottom) {
        window.setStatusBarColor(top);
        window.setNavigationBarColor(bottom);
    }
}
