import Foundation
import Capacitor

@objc(CloudStorePlugin)
public class CloudStorePlugin: CAPPlugin {
    
    @objc func get(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Must provide a key")
            return
        }
        let value = NSUbiquitousKeyValueStore.default.string(forKey: key)
        call.resolve(["value": value ?? ""])
    }
    
    @objc func set(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value") else {
            call.reject("Must provide key and value")
            return
        }
        NSUbiquitousKeyValueStore.default.set(value, forKey: key)
        NSUbiquitousKeyValueStore.default.synchronize()
        call.resolve()
    }
    
    @objc func remove(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Must provide a key")
            return
        }
        NSUbiquitousKeyValueStore.default.removeObject(forKey: key)
        NSUbiquitousKeyValueStore.default.synchronize()
        call.resolve()
    }
}
