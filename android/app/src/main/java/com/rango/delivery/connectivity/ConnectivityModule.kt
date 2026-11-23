package com.rango.delivery.connectivity

import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ConnectivityModule(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

  private val manager = context.getSystemService(ConnectivityManager::class.java)
  private var online = manager.getNetworkCapabilities(manager.activeNetwork).hasInternet()

  private val callback =
      object : ConnectivityManager.NetworkCallback() {
        override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
          publish(capabilities.hasInternet())
        }

        override fun onLost(network: Network) {
          publish(false)
        }
      }

  override fun getName() = "Connectivity"

  override fun initialize() {
    super.initialize()
    manager.registerDefaultNetworkCallback(callback)
  }

  override fun invalidate() {
    manager.unregisterNetworkCallback(callback)
    super.invalidate()
  }

  @ReactMethod
  fun isOnline(promise: Promise) {
    promise.resolve(online)
  }

  @ReactMethod fun addListener(eventName: String) {}

  @ReactMethod fun removeListeners(count: Double) {}

  private fun publish(value: Boolean) {
    if (value == online) return
    online = value
    if (reactApplicationContext.hasActiveReactInstance()) {
      reactApplicationContext.emitDeviceEvent(EVENT, value)
    }
  }

  private fun NetworkCapabilities?.hasInternet(): Boolean =
      this?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true

  companion object {
    const val EVENT = "connectivityChanged"
  }
}
