#!/system/bin/sh
# 系统启动后执行

MODDIR=${0%/*}

# 备份原始 HAL（如果不存在）
if [ ! -f /vendor/lib64/hw/camera.vendor.so.bak ]; then
    cp /vendor/lib64/hw/camera.vendor.so /vendor/lib64/hw/camera.vendor.so.bak
    log -t VirtualCam "Original HAL backed up"
fi

# 加载配置
if [ -f "$MODDIR/config.prop" ]; then
    source "$MODDIR/config.prop"
fi

# 启动虚拟摄像头服务
if [ "$ENABLE_SERVICE" = "1" ]; then
    start vcam-service
fi

log -t VirtualCam "Module loaded, video=$VIDEO_PATH"
