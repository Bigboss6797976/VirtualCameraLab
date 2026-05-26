# VirtualCamera Lab 架构文档

## 数据流
MP4 -> MediaExtractor -> MediaCodec -> Surface -> [Frida Hook] -> Camera2 ImageReader -> 应用

## 注入点
1. 应用层: ImageReader.OnImageAvailableListener
2. Framework: CameraService
3. HAL: camera.vendor.so
4. 内核: /dev/video*

## 阶段
| 阶段 | 技术 |
|------|------|
| 1 | Camera2 API |
| 2 | MediaCodec |
| 3 | Frida Hook |
| 4 | Magisk/Kernel |
