/**
 * Frida Hook - Camera2 API
 * frida -U -f com.target.app -l hook_camera2.js --no-pause
 */

Java.perform(function() {
    console.log("[*] Camera2 Hook started");
    
    var CameraDeviceImpl = Java.use("android.hardware.camera2.impl.CameraDeviceImpl");
    CameraDeviceImpl.createCaptureSession.implementation = function(outputs, callback, handler) {
        console.log("[*] createCaptureSession called, outputs=" + outputs.size());
        return this.createCaptureSession(outputs, callback, handler);
    };
    
    var ImageReader = Java.use("android.media.ImageReader");
    ImageReader.setOnImageAvailableListener.overload(
        'android.media.ImageReader$OnImageAvailableListener', 
        'android.os.Handler'
    ).implementation = function(listener, handler) {
        console.log("[*] ImageReader listener set");
        return this.setOnImageAvailableListener(listener, handler);
    };
    
    var module = Process.findModuleByName("libcamera_client.so");
    if (module) {
        console.log("[*] libcamera_client.so @ " + module.base);
        Module.enumerateExports("libcamera_client.so").forEach(function(exp) {
            if (exp.name.indexOf("Preview") !== -1 || exp.name.indexOf("Frame") !== -1) {
                console.log("  [NATIVE] " + exp.name + " @ " + exp.address);
            }
        });
    }
    
    console.log("[*] Hook ready");
});
