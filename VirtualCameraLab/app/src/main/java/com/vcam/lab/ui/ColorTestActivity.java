package com.vcam.lab.ui;

import android.graphics.*;
import android.media.Image;
import android.os.Bundle;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.SeekBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.vcam.lab.R;

import java.nio.ByteBuffer;

public class ColorTestActivity extends AppCompatActivity {
    private android.view.TextureView textureView;
    private TextView tvIntensity, tvDiameter, tvX, tvY;
    private RadioGroup rgMode;
    private SeekBar seekIntensity, seekDiameter, seekX, seekY;
    private int mode = 1;
    private float intensity = 0.19f, diameter = 0.91f, centerX = 0.47f, centerY = 0.50f;
    private int injectColor = Color.TRANSPARENT;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_color_test);
        initViews();
        initListeners();
        startColorCycle();
    }

    private void initViews() {
        textureView = findViewById(R.id.texture_color_preview);
        tvIntensity = findViewById(R.id.tv_intensity);
        tvDiameter = findViewById(R.id.tv_diameter);
        tvX = findViewById(R.id.tv_x);
        tvY = findViewById(R.id.tv_y);
        rgMode = findViewById(R.id.rg_mode);
        seekIntensity = findViewById(R.id.seek_intensity);
        seekDiameter = findViewById(R.id.seek_diameter);
        seekX = findViewById(R.id.seek_x);
        seekY = findViewById(R.id.seek_y);
        seekIntensity.setProgress(19);
        seekDiameter.setProgress(91);
        seekX.setProgress(47);
        seekY.setProgress(50);
        updateLabels();
    }

    private void initListeners() {
        rgMode.setOnCheckedChangeListener((group, checkedId) -> {
            mode = (checkedId == R.id.rb_mode1) ? 1 : 2;
        });
        SeekBar.OnSeekBarChangeListener listener = new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                updateLabels();
            }
            @Override public void onStartTrackingTouch(SeekBar seekBar) {}
            @Override public void onStopTrackingTouch(SeekBar seekBar) {}
        };
        seekIntensity.setOnSeekBarChangeListener(listener);
        seekDiameter.setOnSeekBarChangeListener(listener);
        seekX.setOnSeekBarChangeListener(listener);
        seekY.setOnSeekBarChangeListener(listener);
    }

    private void updateLabels() {
        intensity = seekIntensity.getProgress() / 100f;
        diameter = seekDiameter.getProgress() / 100f;
        centerX = seekX.getProgress() / 100f;
        centerY = seekY.getProgress() / 100f;
        tvIntensity.setText(String.format("照射强度:%.0f%%", intensity * 100));
        tvDiameter.setText(String.format("照射直径:%.0f%%", diameter * 100));
        tvX.setText(String.format("X坐标:%.0f%%", centerX * 100));
        tvY.setText(String.format("Y坐标:%.1f%%", centerY * 100));
    }

    private void startColorCycle() {
        final int[] colors = {Color.RED, Color.GREEN, Color.BLUE, Color.YELLOW, Color.CYAN, Color.MAGENTA};
        new Thread(() -> {
            int idx = 0;
            while (!isDestroyed()) {
                injectColor = colors[idx % colors.length];
                runOnUiThread(this::applyColorOverlay);
                idx++;
                try { Thread.sleep(2000); } catch (InterruptedException e) { break; }
            }
        }).start();
    }

    private void applyColorOverlay() {
        textureView.setDrawingCacheEnabled(true);
        Bitmap original = textureView.getDrawingCache();
        if (original == null) return;
        Bitmap result = Bitmap.createBitmap(original.getWidth(), original.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(result);
        canvas.drawBitmap(original, 0, 0, null);
        int w = result.getWidth(), h = result.getHeight();
        float cx = centerX * w, cy = centerY * h;
        float radius = (diameter * Math.min(w, h)) / 2f;

        RadialGradient gradient = new RadialGradient(cx, cy, radius,
            new int[]{injectColor, Color.TRANSPARENT}, new float[]{0f, 1f}, Shader.TileMode.CLAMP);
        Paint paint = new Paint();
        paint.setShader(gradient);
        paint.setAlpha((int)(intensity * 255));
        canvas.drawCircle(cx, cy, radius, paint);

        if (mode == 2) {
            Paint borderPaint = new Paint();
            borderPaint.setColor(injectColor);
            borderPaint.setStyle(Paint.Style.STROKE);
            borderPaint.setStrokeWidth(20 * intensity);
            borderPaint.setAlpha((int)(intensity * 200));
            canvas.drawRect(0, 0, w, h, borderPaint);
        }
        textureView.setDrawingCacheEnabled(false);
    }

    public static void injectColorToYUV(Image image, int color, float intensity,
                                         float cx, float cy, float radius) {
        if (image.getFormat() != android.graphics.ImageFormat.YUV_420_888) return;
        Image.Plane[] planes = image.getPlanes();
        ByteBuffer yBuffer = planes[0].getBuffer();
        ByteBuffer uBuffer = planes[1].getBuffer();
        ByteBuffer vBuffer = planes[2].getBuffer();
        int width = image.getWidth(), height = image.getHeight();
        int r = Color.red(color), g = Color.green(color), b = Color.blue(color);
        int yVal = (int)(0.299f * r + 0.587f * g + 0.114f * b);
        int uVal = (int)(-0.169f * r - 0.331f * g + 0.499f * b + 128);
        int vVal = (int)(0.499f * r - 0.418f * g - 0.0813f * b + 128);

        for (int row = 0; row < height; row++) {
            for (int col = 0; col < width; col++) {
                float dist = (float) Math.sqrt(
                    Math.pow(col - cx * width, 2) + Math.pow(row - cy * height, 2));
                if (dist < radius) {
                    float factor = intensity * (1 - dist / radius);
                    int idx = row * width + col;
                    byte origY = yBuffer.get(idx);
                    int newY = (int)((1 - factor) * (origY & 0xFF) + factor * yVal);
                    yBuffer.put(idx, (byte) Math.min(255, Math.max(0, newY)));
                    if ((row % 2 == 0) && (col % 2 == 0)) {
                        int uvIdx = (row / 2) * (width / 2) + (col / 2);
                        uBuffer.put(uvIdx, (byte) uVal);
                        vBuffer.put(uvIdx, (byte) vVal);
                    }
                }
            }
        }
    }
}
