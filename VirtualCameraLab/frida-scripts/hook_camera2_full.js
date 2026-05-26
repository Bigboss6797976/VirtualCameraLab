/**
 * 阶段3: Frida Hook Camera2 API - 完整版
 * 功能: 拦截相机帧，替换为预加载的视频帧数据
 * 
 * 使用方法:
 *   frida -U -f com.target.app -l hook_camera2_full.js --no-pause
 *   frida -U -n com.target.app -l hook_camera2_full.js
 */

// 配置
var CONFIG = {
    enableInjection: true,      // 是否启用注入
    videoPath: "/data/local/tmp/virtual.yuv",  // 预转换的YUV视频帧
    frameWidth: 640,
    frameHeight: 480,
    targetPackage: null         // 自动检测
};

// 全局帧缓冲区
var frameBuffer = null;
var frameIndex = 0;

Java.perform(function() {
    console.log("[*] ====================================");
    console.log("[*] VirtualCamera Frida Hook v2.0");
    console.log("[*] ====================================");
    
    // 加载预处理的视频帧
    loadVideoFrames();
    
    // Hook 1: CameraDeviceImpl.createCaptureSession
    hookCaptureSession();
    
    // Hook 2: ImageReader 帧回调
    hookImageReader();
    
    // Hook 3: CameraCaptureSession.CaptureCallback
    hookCaptureCallback();
    
    // Hook 4: Native 层 libcamera_client.so
    hookNativeCamera();
    
    console.log("[*] All hooks installed");
    console.log("[*] Waiting for camera activity...");
});

/**
 * 加载预处理的 YUV 视频帧
 */
function loadVideoFrames() {
    try {
        var file = new Java.io.File(CONFIG.videoPath);
        if (!file.exists()) {
            console.log("[!] Video frame file not found: " + CONFIG.videoPath);
            console.log("[!] Run: ffmpeg -i input.mp4 -pix_fmt yuv420p -s 640x480 virtual.yuv");
            return;
        }
        
        var fis = new Java.io.FileInputStream(file);
        var channel = fis.getChannel();
        var size = channel.size();
        
        // 一帧大小: width * height * 1.5 (YUV420)
        var frameSize = CONFIG.frameWidth * CONFIG.frameHeight * 3 / 2;
        var frameCount = Math.floor(size / frameSize);
        
        console.log("[*] Loaded " + frameCount + " frames (" + (size/1024/1024).toFixed(2) + " MB)");
        
        // 读取到内存
        var buf = Java.nio.ByteBuffer.allocate(size);
        channel.read(buf);
        frameBuffer = buf.array();
        
        fis.close();
    } catch (e) {
        console.log("[!] Failed to load video frames: " + e);
    }
}

/**
 * Hook CaptureSession 创建
 */
function hookCaptureSession() {
    var CameraDeviceImpl = Java.use("android.hardware.camera2.impl.CameraDeviceImpl");
    
    CameraDeviceImpl.createCaptureSession.overload(
        'java.util.List', 
        'android.hardware.camera2.CameraCaptureSession$StateCallback', 
        'android.os.Handler'
    ).implementation = function(outputs, callback, handler) {
        console.log("[*] createCaptureSession called");
        console.log("    Outputs: " + outputs.size());
        
        // 遍历输出配置
        for (var i = 0; i < outputs.size(); i++) {
            var config = outputs.get(i);
            console.log("    [" + i + "] " + config.getClass().getName());
        }
        
        return this.createCaptureSession(outputs, callback, handler);
    };
}

/**
 * Hook ImageReader 帧回调 - 核心注入点
 */
function hookImageReader() {
    var ImageReader = Java.use("android.media.ImageReader");
    var Image = Java.use("android.media.Image");
    var ImageFormat = Java.use("android.graphics.ImageFormat");
    
    // Hook acquireLatestImage
    ImageReader.acquireLatestImage.implementation = function() {
        var image = this.acquireLatestImage();
        if (image && CONFIG.enableInjection && frameBuffer) {
            injectFrame(image);
        }
        return image;
    };
    
    // Hook acquireNextImage
    ImageReader.acquireNextImage.implementation = function() {
        var image = this.acquireNextImage();
        if (image && CONFIG.enableInjection && frameBuffer) {
            injectFrame(image);
        }
        return image;
    };
}

/**
 * 注入帧数据 - 核心算法
 */
function injectFrame(image) {
    try {
        var format = image.getFormat();
        if (format !== 35) { // YUV_420_888 = 35
            console.log("[!] Unsupported format: " + format);
            return;
        }
        
        var width = image.getWidth();
        var height = image.getHeight();
        
        if (width !== CONFIG.frameWidth || height !== CONFIG.frameHeight) {
            console.log("[!] Size mismatch: camera=" + width + "x" + height + 
                       " video=" + CONFIG.frameWidth + "x" + CONFIG.frameHeight);
            return;
        }
        
        var planes = image.getPlanes();
        
        // 计算帧偏移
        var frameSize = width * height * 3 / 2;
        var offset = (frameIndex * frameSize) % frameBuffer.length;
        frameIndex++;
        
        // 注入 Y 平面
        var yBuffer = planes[0].getBuffer();
        var ySize = width * height;
        yBuffer.clear();
        yBuffer.put(frameBuffer, offset, ySize);
        
        // 注入 U 平面
        var uBuffer = planes[1].getBuffer();
        var uvSize = width * height / 4;
        uBuffer.clear();
        uBuffer.put(frameBuffer, offset + ySize, uvSize);
        
        // 注入 V 平面
        var vBuffer = planes[2].getBuffer();
        vBuffer.clear();
        vBuffer.put(frameBuffer, offset + ySize + uvSize, uvSize);
        
        if (frameIndex % 30 === 0) {
            console.log("[*] Injected frame #" + frameIndex);
        }
        
    } catch (e) {
        console.log("[!] Injection error: " + e);
    }
}

/**
 * Hook CaptureCallback
 */
function hookCaptureCallback() {
    var CaptureCallback = Java.use("android.hardware.camera2.CameraCaptureSession$CaptureCallback");
    
    CaptureCallback.onCaptureCompleted.implementation = function(session, request, result) {
        // 可以修改元数据（如曝光、白平衡）使注入更自然
        return this.onCaptureCompleted(session, request, result);
    };
}

/**
 * Hook Native 层
 */
function hookNativeCamera() {
    var module = Process.findModuleByName("libcamera_client.so");
    if (!module) {
        console.log("[!] libcamera_client.so not found");
        return;
    }
    
    console.log("[*] Hooking native camera library @ " + module.base);
    
    // 枚举关键函数
    var targets = [
        "_ZN7android8CameraBase15setPreviewCallbackEPNS_18CameraPreviewCallbackE",
        "_ZN7android6Camera18setPreviewCallbackEPNS_18CameraPreviewCallbackE",
        "_ZN7android13CameraSource17dataCallbackTimestampEiPNS_7SpMemoryE"
    ];
    
    targets.forEach(function(name) {
        try {
            var addr = Module.findExportByName("libcamera_client.so", name);
            if (addr) {
                console.log("  [+] " + name + " @ " + addr);
                
                Interceptor.attach(addr, {
                    onEnter: function(args) {
                        console.log("    [*] " + name + " called");
                    }
                });
            }
        } catch (e) {
            // 函数可能不存在
        }
    });
}

/**
 * 辅助: 内存扫描寻找 YUV 缓冲区
 */
function scanYUVBuffers() {
    console.log("[*] Scanning for YUV buffers...");
    
    var targetSize = CONFIG.frameWidth * CONFIG.frameHeight * 3 / 2;
    
    Process.enumerateRanges('rw-').forEach(function(range) {
        if (range.size >= targetSize && range.size <= targetSize * 2) {
            console.log("  [?] Potential buffer: " + range.base + " size=" + range.size);
        }
    });
}

/**
 * 辅助: 实时修改注入参数
 */
rpc.exports = {
    setEnable: function(enable) {
        CONFIG.enableInjection = enable;
        console.log("[*] Injection " + (enable ? "enabled" : "disabled"));
    },
    setVideoPath: function(path) {
        CONFIG.videoPath = path;
        loadVideoFrames();
    },
    getStatus: function() {
        return {
            enabled: CONFIG.enableInjection,
            frameIndex: frameIndex,
            bufferLoaded: frameBuffer !== null
        };
    }
};
