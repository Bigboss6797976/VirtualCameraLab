#!/system/bin/sh
MODDIR=${0%/*}
if [ ! -f /vendor/lib64/hw/camera.vendor.so.bak ]; then
    cp /vendor/lib64/hw/camera.vendor.so /vendor/lib64/hw/camera.vendor.so.bak
fi
log -t VirtualCam "HAL module loaded"
