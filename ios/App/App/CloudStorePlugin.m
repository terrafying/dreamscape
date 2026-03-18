#import <Capacitor/Capacitor.h>

CAP_PLUGIN(CloudStorePlugin, "CloudStore",
    CAP_PLUGIN_METHOD(get, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(set, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(remove, CAPPluginReturnPromise);
)
