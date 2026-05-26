#!/system/bin/sh
# 后台服务脚本

MODDIR=${0%/*}

while true; do
    if [ -f "$MODDIR/fifo/video" ]; then
        # 读取视频帧并写入共享内存
        cat "$MODDIR/fifo/video" > /dev/vcam0
    fi
    sleep 0.033  # 30fps
done
