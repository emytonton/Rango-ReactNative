package com.rango.delivery.notification

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.rango.delivery.R

class LocalNotificationModule(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

  override fun getName() = "LocalNotification"

  @ReactMethod
  fun show(id: Double, title: String, body: String) {
    val context = reactApplicationContext
    if (!canNotify()) return
    ensureChannel()
    val intent =
        Intent(Intent.ACTION_VIEW, Uri.parse(OPEN_URI)).apply {
          setPackage(context.packageName)
          addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
    val pending =
        PendingIntent.getActivity(
            context,
            id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    val notification =
        NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_rango)
            .setColor(BRAND_COLOR)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pending)
            .setAutoCancel(true)
            .build()
    NotificationManagerCompat.from(context).notify(id.toInt(), notification)
  }

  private fun canNotify(): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
          ContextCompat.checkSelfPermission(
              reactApplicationContext,
              Manifest.permission.POST_NOTIFICATIONS,
          ) == PackageManager.PERMISSION_GRANTED

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = reactApplicationContext.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Pedidos", NotificationManager.IMPORTANCE_HIGH).apply {
          description = "Confirmação, preparo e entrega"
        },
    )
  }

  private companion object {
    const val CHANNEL_ID = "orders"
    const val OPEN_URI = "rango://notifications"
    const val BRAND_COLOR = 0xFFFF6B00.toInt()
  }
}
