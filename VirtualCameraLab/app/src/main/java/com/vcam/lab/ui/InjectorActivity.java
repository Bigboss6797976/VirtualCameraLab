package com.vcam.lab.ui;

import android.media.*;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;
import android.view.Surface;
import android.widget.Button;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.vcam.lab.R;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * 阶段2: MediaCodec 视频解码 + Surface 注入
 * 将 MP4 视频解码到 Surface，再通过 IPC/共享内存注入到相机流
 */
public class InjectorActivity extends AppCompatActivity {
    
    private static final String TAG = "VCAM-INJECT";
    
    private TextView tvStatus, tvVideoInfo;
    private Button btnStart, btnStop;
    private SeekBar seekIntensity, seekDiameter, seekX, seekY;
    
    private MediaCodec decoder;
    private MediaExtractor extractor;
    private Surface outputSurface;
    private HandlerThread decodeThread;
    private Handler decodeHandler;
    private volatile boolean isRunning = false;
    
    // 视频信息
    private int videoWidth, videoHeight;
    private long videoDuration;
    private String videoMime;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_injector);
        
        tvStatus = findViewById(R.id.tv_status);
        tvVideoInfo = findViewById(R.id.tv_video_info);
        btnStart = findViewById(R.id.btn_start_inject);
        btnStop = findViewById(R.id.btn_stop_inject);
        seekIntensity = findViewById(R.id.seek_intensity);
        seekDiameter = findViewById(R.id.seek_diameter);
        seekX = findViewById(R.id.seek_x);
        seekY = findViewById(R.id.seek_y);
        
        decodeThread = new HandlerThread("DecodeThread");
        decodeThread.start();
        decodeHandler = new Handler(decodeThread.getLooper());
        
        btnStart.setOnClickListener(v -> startInjection());
        btnStop.setOnClickListener(v -> stopInjection());
        
        // 加载视频信息
        loadVideoInfo();
    }
    
    private void loadVideoInfo() {
        String videoPath = "/sdcard/DCIM/virtual.mp4";
        MediaExtractor ex = new MediaExtractor();
        try {
            ex.setDataSource(videoPath);
            int trackIndex = selectVideoTrack(ex);
            if (trackIndex >= 0) {
                MediaFormat format = ex.getTrackFormat(trackIndex);
                videoWidth = format.getInteger(MediaFormat.KEY_WIDTH);
                videoHeight = format.getInteger(MediaFormat.KEY_HEIGHT);
                videoDuration = format.getLong(MediaFormat.KEY_DURATION) / 1000000; // ms to s
                videoMime = format.getString(MediaFormat.KEY_MIME);
                
                tvVideoInfo.setText(String.format(
                    "视频: %s\n分辨率: %dx%d\n时长: %d秒",
                    videoMime, videoWidth, videoHeight, videoDuration
                ));
            }
            ex.release();
        } catch (IOException e) {
            tvVideoInfo.setText("视频加载失败: " + e.getMessage());
        }
    }
    
    private void startInjection() {
        if (isRunning) return;
        isRunning = true;
        
        decodeHandler.post(() -> {
            try {
                initDecoder("/sdcard/DCIM/virtual.mp4");
                decodeLoop();
            } catch (Exception e) {
                Log.e(TAG, "Injection failed: " + e.getMessage());
                runOnUiThread(() -> {
                    tvStatus.setText("错误: " + e.getMessage());
                    Toast.makeText(this, "注入失败", Toast.LENGTH_LONG).show();
                });
                isRunning = false;
            }
        });
    }
    
    private void stopInjection() {
        isRunning = false;
        runOnUiThread(() -> tvStatus.setText("状态: 已停止"));
    }
    
    /**
     * 初始化 MediaCodec 解码器
     */
    private void initDecoder(String path) throws IOException {
        extractor = new MediaExtractor();
        extractor.setDataSource(path);
        
        int trackIndex = selectVideoTrack(extractor);
        if (trackIndex < 0) throw new IOException("No video track found");
        
        extractor.selectTrack(trackIndex);
        MediaFormat format = extractor.getTrackFormat(trackIndex);
        
        String mime = format.getString(MediaFormat.KEY_MIME);
        int width = format.getInteger(MediaFormat.KEY_WIDTH);
        int height = format.getInteger(MediaFormat.KEY_HEIGHT);
        int frameRate = format.containsKey(MediaFormat.KEY_FRAME_RATE) ? 
            format.getInteger(MediaFormat.KEY_FRAME_RATE) : 30;
        
        Log.d(TAG, String.format("Decoder init: %s %dx%d @%dfps", mime, width, height, frameRate));
        
        // 创建虚拟 SurfaceTexture 接收解码帧
        android.graphics.SurfaceTexture virtualTexture = new android.graphics.SurfaceTexture(0);
        virtualTexture.setDefaultBufferSize(width, height);
        outputSurface = new Surface(virtualTexture);
        
        // 配置解码器
        decoder = MediaCodec.createDecoderByType(mime);
        decoder.configure(format, outputSurface, null, 0);
        decoder.start();
        
        runOnUiThread(() -> tvStatus.setText("状态: 解码中..."));
    }
    
    /**
     * 主解码循环
     */
    private void decodeLoop() {
        final long TIMEOUT_US = 10000;
        MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
        boolean isEOS = false;
        int outputCount = 0;
        long loopStart = System.currentTimeMillis();
        
        while (isRunning && !Thread.interrupted()) {
            // 输入: 读取视频数据送入解码器
            if (!isEOS) {
                int inputBufferId = decoder.dequeueInputBuffer(TIMEOUT_US);
                if (inputBufferId >= 0) {
                    ByteBuffer buffer = decoder.getInputBuffer(inputBufferId);
                    int sampleSize = extractor.readSampleData(buffer, 0);
                    
                    if (sampleSize < 0) {
                        decoder.queueInputBuffer(inputBufferId, 0, 0, 0, 
                            MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                        isEOS = true;
                        Log.d(TAG, "EOS reached");
                    } else {
                        long sampleTime = extractor.getSampleTime();
                        decoder.queueInputBuffer(inputBufferId, 0, sampleSize, sampleTime, 0);
                        extractor.advance();
                    }
                }
            }
            
            // 输出: 获取解码后的帧
            int outputBufferId = decoder.dequeueOutputBuffer(info, TIMEOUT_US);
            if (outputBufferId >= 0) {
                // 渲染到 Surface - 这里可以 Hook 替换
                decoder.releaseOutputBuffer(outputBufferId, true);
                outputCount++;
                
                // 更新状态
                if (outputCount % 30 == 0) { // 每秒更新一次 (30fps)
                    long elapsed = System.currentTimeMillis() - loopStart;
                    float fps = outputCount / (elapsed / 1000f);
                    final int frame = outputCount;
                    runOnUiThread(() -> tvStatus.setText(
                        String.format("状态: 解码中 | 帧:%d | %.1f FPS", frame, fps)));
                }
                
            } else if (outputBufferId == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                Log.d(TAG, "Output format changed: " + decoder.getOutputFormat());
            } else if (outputBufferId == MediaCodec.INFO_TRY_AGAIN_LATER) {
                // 正常情况，继续循环
            }
            
            // 循环播放
            if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                Log.d(TAG, "Looping video");
                extractor.seekTo(0, MediaExtractor.SEEK_TO_CLOSEST_SYNC);
                isEOS = false;
                outputCount = 0;
                loopStart = System.currentTimeMillis();
            }
        }
        
        cleanup();
    }
    
    private void cleanup() {
        if (decoder != null) {
            decoder.stop();
            decoder.release();
            decoder = null;
        }
        if (extractor != null) {
            extractor.release();
            extractor = null;
        }
        Log.d(TAG, "Decoder cleanup complete");
    }
    
    private int selectVideoTrack(MediaExtractor extractor) {
        for (int i = 0; i < extractor.getTrackCount(); i++) {
            MediaFormat format = extractor.getTrackFormat(i);
            String mime = format.getString(MediaFormat.KEY_MIME);
            if (mime != null && mime.startsWith("video/")) return i;
        }
        return -1;
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        isRunning = false;
        decodeThread.quitSafely();
    }
}
