package com.vcam.lab.ui;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.vcam.lab.R;

public class MainActivity extends AppCompatActivity {
    private static final int PERM_REQUEST = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        checkPermissions();

        findViewById(R.id.btn_select_video).setOnClickListener(v -> {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.setType("video/mp4");
            startActivityForResult(intent, 200);
        });

        findViewById(R.id.btn_preview).setOnClickListener(v ->
            startActivity(new Intent(this, PreviewActivity.class)));

        findViewById(R.id.btn_inject).setOnClickListener(v ->
            startActivity(new Intent(this, InjectorActivity.class)));

        findViewById(R.id.btn_color_test).setOnClickListener(v ->
            startActivity(new Intent(this, ColorTestActivity.class)));

        findViewById(R.id.btn_restore).setOnClickListener(v ->
            Toast.makeText(this, "相机已还原", Toast.LENGTH_SHORT).show());
    }

    private void checkPermissions() {
        String[] perms = {
            Manifest.permission.CAMERA,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.SYSTEM_ALERT_WINDOW
        };
        for (String perm : perms) {
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, perms, PERM_REQUEST);
                break;
            }
        }
    }
}
