Java.perform(function() {
    var Camera = Java.use("android.hardware.Camera");
    Camera.setPreviewCallback.overload('android.hardware.Camera$PreviewCallback')
        .implementation = function(cb) {
            console.log("[*] setPreviewCallback called");
            return this.setPreviewCallback(cb);
        };
    Camera.startPreview.implementation = function() {
        console.log("[*] startPreview()");
        return this.startPreview();
    };
});
