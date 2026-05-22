# 能量码生成器 v3.1 (增强版)

支持上传图片的支付宝风格收款码海报生成服务。

## 新增功能
- ✅ 单码美化：支持上传收款码图片 + 输入链接
- ✅ 聚合能量码：上传多个平台收款码图片合并
- ✅ 批量生成：上传图片批量生成多种风格
- ✅ 拖拽上传 + 点击上传
- ✅ 图片预览 + 清除功能
- ✅ 支持 JPG、PNG、GIF、WEBP 格式（最大10MB）

## 部署到 Railway

1. 把代码 push 到 GitHub
2. Railway 自动部署

## API

### POST /api/generate
单码生成，支持 form-data 上传图片。

| 字段 | 类型 | 说明 |
|------|------|------|
| data | string | 收款链接 |
| method | string | 支付方式 |
| qr_image | file | 收款码图片（可选） |
| logo_image | file | 中心Logo（可选） |

### POST /api/generate-multi
聚合码生成，上传多个平台图片。

### POST /api/generate-all
批量生成，支持图片上传。
