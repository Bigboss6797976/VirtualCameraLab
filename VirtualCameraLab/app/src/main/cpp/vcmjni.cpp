#include <jni.h>
#include <android/log.h>
#include <cmath>

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "VCM-JNI", __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "VCM-JNI", __VA_ARGS__)

extern "C" {

JNIEXPORT void JNICALL
Java_com_vcam_lab_ui_ColorTestActivity_nativeInjectFrame(
        JNIEnv *env, jobject thiz,
        jobject yBuffer, jobject uBuffer, jobject vBuffer,
        jint width, jint height,
        jint color, jfloat intensity,
        jfloat centerX, jfloat centerY, jfloat radius) {
    
    uint8_t* yPtr = static_cast<uint8_t*>(env->GetDirectBufferAddress(yBuffer));
    uint8_t* uPtr = static_cast<uint8_t*>(env->GetDirectBufferAddress(uBuffer));
    uint8_t* vPtr = static_cast<uint8_t*>(env->GetDirectBufferAddress(vBuffer));
    
    if (!yPtr || !uPtr || !vPtr) {
        LOGE("Failed to get buffer addresses");
        return;
    }
    
    int r = (color >> 16) & 0xFF;
    int g = (color >> 8) & 0xFF;
    int b = color & 0xFF;
    
    int yVal = (int)(0.299f * r + 0.587f * g + 0.114f * b);
    int uVal = (int)(-0.169f * r - 0.331f * g + 0.499f * b + 128);
    int vVal = (int)(0.499f * r - 0.418f * g - 0.0813f * b + 128);
    
    int cx = (int)(centerX * width);
    int cy = (int)(centerY * height);
    int r_px = (int)(radius * ((width < height) ? width : height) / 2);
    
    for (int row = 0; row < height; row++) {
        for (int col = 0; col < width; col++) {
            int dx = col - cx;
            int dy = row - cy;
            float dist = sqrtf(dx * dx + dy * dy);
            
            if (dist < r_px) {
                float factor = intensity * (1.0f - dist / r_px);
                int idx = row * width + col;
                
                int origY = yPtr[idx];
                int newY = (int)((1.0f - factor) * origY + factor * yVal);
                yPtr[idx] = (uint8_t)((newY < 0) ? 0 : ((newY > 255) ? 255 : newY));
                
                if ((row % 2 == 0) && (col % 2 == 0)) {
                    int uvIdx = (row / 2) * (width / 2) + (col / 2);
                    uPtr[uvIdx] = (uint8_t)uVal;
                    vPtr[uvIdx] = (uint8_t)vVal;
                }
            }
        }
    }
    
    LOGI("Frame processed: %dx%d", width, height);
}

} // extern "C"
