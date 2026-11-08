// Rester connecté en arrière-plan (E18d, CA-APPS-08) : un service au premier plan, avec sa notification permanente
// « Bosco suit tes sessions », garde l'application active ; la vue web continue de suivre le poste et de notifier.
package expo.modules.boscotrust

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

class BoscoKeepAliveService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL, "Bosco · connexion au poste", NotificationManager.IMPORTANCE_LOW)
    )
    // Toucher la notification permanente rouvre l'application
    val open = packageManager.getLaunchIntentForPackage(packageName)
    val pending = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE)
    val notification = Notification.Builder(this, CHANNEL)
      .setContentTitle("Bosco suit tes sessions")
      .setContentText("Connecté au poste sur le réseau local")
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .setContentIntent(pending)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
      startForeground(ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    else startForeground(ID, notification)
    return START_STICKY
  }

  companion object {
    const val CHANNEL = "bosco-keep-alive"
    const val ID = 4310
  }
}
