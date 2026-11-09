// Confiance dans le certificat du poste (CA-APPS-05) : l'empreinte SHA-256 lue dans le QR code d'appairage est gardée
// dans les préférences de l'application ; la vue web (correctif de react-native-webview) n'accepte que ce certificat.
package expo.modules.boscotrust

import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BoscoTrustModule : Module() {
  private val preferences
    get() = requireNotNull(appContext.reactContext).getSharedPreferences("bosco", Context.MODE_PRIVATE)

  override fun definition() = ModuleDefinition {
    Name("BoscoTrust")

    // « AA:BB:… », ou null pour oublier le poste
    Function("setCertificate") { fingerprint: String? ->
      preferences.edit().putString("certificate", fingerprint).apply()
    }

    Function("certificate") {
      preferences.getString("certificate", null)
    }

    // « Rester connecté en arrière-plan » (E18d) : le service au premier plan démarre ou s'arrête
    Function("setKeepAlive") { enabled: Boolean ->
      val context = requireNotNull(appContext.reactContext)
      val intent = Intent(context, BoscoKeepAliveService::class.java)
      if (enabled) context.startForegroundService(intent) else context.stopService(intent)
    }
  }
}
