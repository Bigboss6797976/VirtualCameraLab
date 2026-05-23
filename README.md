# 能量码生成器 v2.0 ⚡

专业的收款码克隆生成工具，支持支付宝/微信/云闪付官方样式克隆。

## 核心功能

- **jsQR 解码**：从截图中提取真实支付链接
- **qrcode.js 重新生成**：生成全新干净二维码
- **官方克隆模板**：完全匹配支付宝蓝/微信绿/云闪付红
- **聚合能量码**：多平台合一，一码多付
- **扫码直接支付**：唤起支付宝/微信，进入输密码页面
- **自定义金额/备注**：扫码直接显示金额

## 技术栈

- React 18 + TypeScript + Vite
- Tailwind CSS
- jsQR（二维码解码）
- qrcode.js（二维码生成）
- HTML5 Canvas（模板渲染）

## 安装运行

```bash
npm install
npm run dev
npm run build
```

## 部署

```bash
./push.sh
```

自动推送到 GitHub，Railway 自动部署。
