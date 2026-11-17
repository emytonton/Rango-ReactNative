package com.rango.delivery.gesture

import android.graphics.Rect
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class GestureExclusionModule(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

  override fun getName() = "GestureExclusion"

  @ReactMethod
  fun exclude(x: Double, y: Double, width: Double, height: Double) {
    val density = reactApplicationContext.resources.displayMetrics.density
    val rect =
        Rect(
            (x * density).toInt(),
            (y * density).toInt(),
            ((x + width) * density).toInt(),
            ((y + height) * density).toInt(),
        )
    setRects(listOf(rect))
  }

  @ReactMethod
  fun clear() {
    setRects(emptyList())
  }

  private fun setRects(rects: List<Rect>) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return
    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread { activity.window.decorView.systemGestureExclusionRects = rects }
  }
}
