#!/system/bin/sh
# Magisk 模块安装脚本

# 检查架构
if [ "$ARCH" = "arm64" ]; then
    LIBDIR="$MODPATH/system/vendor/lib64/hw"
elif [ "$ARCH" = "arm" ]; then
    LIBDIR="$MODPATH/system/vendor/lib/hw"
else
    abort "! 不支持的架构: $ARCH"
fi

# 创建目录
mkdir -p "$LIBDIR"
mkdir -p "$MODPATH/system/bin"

# 复制 HAL 库
ui_print "- 安装虚拟摄像头 HAL..."
cp "$MODPATH/halcamera.so" "$LIBDIR/camera.vendor.so"

# 设置权限
set_perm_recursive "$MODPATH/system" 0 0 0755 0644

ui_print "- 虚拟摄像头 HAL 安装完成"
ui_print "- 重启后生效"
