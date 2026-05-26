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

public class InjectorActivity extends AppCompatActivity {
    private static final String TAG = "VCAM-INJECT";
    private TextView tvStatus;
    private MediaCodec decoder;
    private MediaExtractor extractor;
    private Surface outputSurface;
    private HandlerThread decodeThread;
    private Handler decodeHandler;
    private android.graphics.SurfaceTexture virtualTexture;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_injector);
        tvStatus = findViewById(R.id.tv_status);
        decodeThread = new HandlerThread("DecodeThread");
        decodeThread.start();
        decodeHandler = new Handler(decodeThread.getLooper());
        findViewById(R.id.btn_start_inject).setOnClickListener(v -> startInjection());
    }

    private void startInjection() {
        String videoPath = "/sdcard/DCIM/virtual.mp4";
        decodeHandler.post(() -> {
            try {
                initDecoder(videoPath);
                decodeLoop();
            } catch (IOException e) {
                Log.e(TAG, "Init failed: " + e.getMessage());
                runOnUiThread(() -> Toast.makeText(this,
                    "初始化失败: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        });
    }

    private void initDecoder(String path) throws IOException {
        extractor = new MediaExtractor();
        extractor.setDataSource(path);
        int trackIndex = selectVideoTrack(extractor);
        if (trackIndex < 0) throw new IOException("No video track");
        extractor.selectTrack(trackIndex);
        MediaFormat format = extractor.getTrackFormat(trackIndex);
        String mime = format.getString(MediaFormat.KEY_MIME);
        int width = format.getInteger(MediaFormat.KEY_WIDTH);
        int height = format.getInteger(MediaFormat.KEY_HEIGHT);
        Log.d(TAG, String.format("Video: %s %dx%d", mime, width, height));

        virtualTexture = new android.graphics.SurfaceTexture(0);
        virtualTexture.setDefaultBufferSize(width, height);
        outputSurface = new Surface(virtualTexture);

        decoder = MediaCodec.createDecoderByType(mime);
        decoder.configure(format, outputSurface, null, 0);
        decoder.start();
        runOnUiThread(() -> tvStatus.setText("状态: 解码中"));
    }

    private void decodeLoop() {
        final long TIMEOUT_US = 10000;
        MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
        boolean isEOS = false;
        while (!Thread.interrupted()) {
            if (!isEOS) {
                int inputBufferId = decoder.dequeueInputBuffer(TIMEOUT_US);
                if (inputBufferId >= 0) {
                    ByteBuffer buffer = decoder.getInputBuffer(inputBufferId);
                    int sampleSize = extractor.readSampleData(buffer, 0);
                    if (sampleSize < 0) {
                        decoder.queueInputBuffer(inputBufferId, 0, 0, 0,
                            MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                        isEOS = true;
                    } else {
                        decoder.queueInputBuffer(inputBufferId, 0, sampleSize,
                            extractor.getSampleTime(), 0);
                        extractor.advance();
                    }
                }
            }
            int outputBufferId = decoder.dequeueOutputBuffer(info, TIMEOUT_US);
            if (outputBufferId >= 0) {
                decoder.releaseOutputBuffer(outputBufferId, true);
            } else if (outputBufferId == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                Log.d(TAG, "Format changed: " + decoder.getOutputFormat());
            }
            if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                extractor.seekTo(0, MediaExtractor.SEEK_TO_CLOSEST_SYNC);
                isEOS = false;
            }
        }
    }

    private int selectVideoTrack(MediaExtractor extractor) {
        for (int i = 0; i < extractor.getTrackCount(); i++) {
            String mime = extractor.getTrackFormat(i).getString(MediaFormat.KEY_MIME);
            if (mime != null && mime.startsWith("video/")) return i;
        }
        return -1;
    }

    @Override protected void onDestroy() {
        super.onDestroy();
        if (decoder != null) { decoder.stop(); decoder.release(); }
        if (extractor != null) extractor.release();
        decodeThread.quitSafely();
    }
}
