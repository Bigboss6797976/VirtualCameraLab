import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrScale, setQrScale] = useState<number>(82);
  const [avatarSize, setAvatarSize] = useState<number>(120);
  const [outputSize, setOutputSize] = useState<string>("1200");
  
  const [qrImage, setQrImage] = useState<HTMLImageElement | null>(null);
  const [avatarImage, setAvatarImage] = useState<HTMLImageElement | null>(null);

  const [qrFileName, setQrFileName] = useState<string>("点击或拖拽上传二维码");
  const [avatarFileName, setAvatarFileName] = useState<string>("点击或拖拽上传中心Logo");

  // 核心一比一渲染逻辑
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseW = 1200;
    const baseH = 1800;
    canvas.width = baseW;
    canvas.height = baseH;

    // 1. 官方标准海报蓝背景
    ctx.fillStyle = "#0a7aff";
    ctx.fillRect(0, 0, baseW, baseH);

    // 2. 顶部的官方白卡片区
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, baseW, 280);

    // 3. 官方「支」字Icon
    const iconX = baseW / 2;
    const iconY = 130;
    const iconR = 54;
    ctx.fillStyle = "#0a7aff";
    ctx.beginPath();
    // @ts-ignore
    ctx.roundRect(iconX - iconR, iconY - iconR, iconR * 2, iconR * 2, 18);
    ctx.fill();
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 76px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("支", iconX, iconY + 2);

    // 4. 官方顶部副标题
    ctx.fillStyle = "#909399";
    ctx.font = "28px sans-serif";
    ctx.fillText("官方克隆 · 扫码直付 · 聚合能量", baseW / 2, 235);

    // 5. 居中白色大卡片
    const cardW = 900; const cardH = 960;
    const cardX = (baseW - cardW) / 2; const cardY = 460;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    // @ts-ignore
    ctx.roundRect(cardX, cardY, cardW, cardH, 40);
    ctx.fill();

    // 6. “推荐使用支付宝”
    ctx.fillStyle = "#0a7aff";
    ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
    ctx.fillText("推荐使用支付宝", baseW / 2, cardY + 110);

    // 7. 渲染收款码
    const scale = qrScale / 100;
    const qrW = 620 * scale; const qrH = 620 * scale;
    const qrX = baseW / 2 - qrW / 2;
    const qrY = cardY + 450 - qrH / 2;

    if (qrImage) {
      ctx.drawImage(qrImage, qrX, qrY, qrW, qrH);
    } else {
      ctx.fillStyle = "#f4f5f7";
      ctx.fillRect(qrX, qrY, qrW, qrH);
      ctx.fillStyle = "#909399";
      ctx.font = "36px sans-serif";
      ctx.fillText("未上传收款码", baseW / 2, qrY + qrH / 2);
    }

    // 8. 四角内嵌扁平“绿色能量”标签
    const tagW = 140; const tagH = 46; const tagRadius = 8;
    const offset = 10;
    const tagPositions = [
      { x: qrX + offset, y: qrY + offset },
      { x: qrX + qrW - tagW - offset, y: qrY + offset },
      { x: qrX + offset, y: qrY + qrH - tagH - offset },
      { x: qrX + qrW - tagW - offset, y: qrY + qrH - tagH - offset }
    ];

    tagPositions.forEach(pos => {
      ctx.fillStyle = "#52b324";
      ctx.beginPath();
      // @ts-ignore
      ctx.roundRect(pos.x, pos.y, tagW, tagH, tagRadius);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("绿色能量", pos.x + tagW / 2, pos.y + tagH / 2 + 1);
    });

    // 9. “打开支付宝 [扫一扫]”
    ctx.fillStyle = "#0a7aff";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("打开支付宝 [扫一扫]", baseW / 2, cardY + cardH - 85);

    // 10. 中心Logo覆盖
    const avaX = baseW / 2; const avaY = qrY + qrH / 2;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    // @ts-ignore
    ctx.roundRect(avaX - avatarSize/2 - 8, avaY - avatarSize/2 - 8, avatarSize + 16, avatarSize + 16, 14);
    ctx.fill();

    if (avatarImage) {
      ctx.save(); ctx.beginPath();
      // @ts-ignore
      ctx.roundRect(avaX - avatarSize/2, avaY - avatarSize/2, avatarSize, avatarSize, 10);
      ctx.clip(); ctx.drawImage(avatarImage, avaX - avatarSize/2, avaY - avatarSize/2, avatarSize, avatarSize);
      ctx.restore();
    } else {
      ctx.fillStyle = "#0a7aff"; ctx.beginPath();
      // @ts-ignore
      ctx.roundRect(avaX - avatarSize/2, avaY - avatarSize/2, avatarSize, avatarSize, 10);
      ctx.fill(); ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${avatarSize * 0.7}px sans-serif`;
      ctx.fillText("支", avaX, avaY + 2);
    }

    // 11. 底部行规范字
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 44px sans-serif";
    ctx.fillText("支付得蚂蚁森林能量", baseW / 2, baseH - 240);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)"; ctx.font = "28px sans-serif";
    ctx.fillText("扫码直接支付，无需输入金额", baseW / 2, baseH - 170);
  };

  useEffect(() => { renderCanvas(); }, [qrScale, avatarSize, qrImage, avatarImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'qr' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'qr') setQrFileName(file.name); else setAvatarFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => { if (type === 'qr') setQrImage(img); else setAvatarImage(img); };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const outSize = parseInt(outputSize);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = outSize; tempCanvas.height = outSize * 1.5;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      const link = document.createElement('a');
      link.download = `HD科技_官方能量码_${outSize}px.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div style={{ background: '#0b0e14', color: '#abb2bf', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textValues: 'center', color: '#fff', fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>官方一比一能量码生成系统</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyValues: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* 控制面板 */}
        <div style={{ flex: '1', minWidth: '320px', background: '#1a1f2c', padding: '20px', borderRadius: '16px' }}>
          <h2 style={{ color: '#fff', fontSize: '16px', borderBottom: '1px solid #2e374a', paddingBottom: '8px' }}>1. 上传资产</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>收款二维码 (JPG/PNG)</label>
            <div onClick={() => document.getElementById('qrIn')?.click()} style={{ background: '#11141e', border: '2px dashed #3b455c', padding: '15px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>{qrFileName}</div>
            <input id="qrIn" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'qr')} style={{ display: 'none' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px' }}>自定义中心 Logo</label>
            <div onClick={() => document.getElementById('avaIn')?.click()} style={{ background: '#11141e', border: '2px dashed #3b455c', padding: '15px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>{avatarFileName}</div>
            <input id="avaIn" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} style={{ display: 'none' }} />
          </div>

          <h2 style={{ color: '#fff', fontSize: '16px', marginTop: '20px', borderBottom: '1px solid #2e374a', paddingBottom: '8px' }}>2. 官方细节缩放微调</h2>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '13px' }}>二维码尺寸调节</label>
            <input type="range" min="65" max="95" value={qrScale} onChange={(e) => setQrScale(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#1677ff' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '13px' }}>中心Logo大小</label>
            <input type="range" min="80" max="180" value={avatarSize} onChange={(e) => setAvatarSize(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#1677ff' }} />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '13px' }}>输出尺寸选择</label>
            <select value={outputSize} onChange={(e) => setOutputSize(e.target.value)} style={{ width: '100%', padding: '10px', background: '#11141e', color: '#fff', border: '1px solid #2e374a', borderRadius: '8px' }}>
              <option value="800">标准 800px</option>
              <option value="1200">高清 1200px</option>
              <option value="2000">超清 2000px</option>
            </select>
          </div>
        </div>

        {/* 预览面板 */}
        <div style={{ flex: '1', minWidth: '320px', background: '#1a1f2c', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: '16px', width: '100%', borderBottom: '1px solid #2e374a', paddingBottom: '8px' }}>2. 官方克隆预览</h2>
          <div style={{ width: '100%', maxWidth: '340px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', margin: '15px 0' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
          <button onClick={downloadImage} style={{ width: '100%', padding: '14px', background: '#1677ff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>生成并打包高清下载</button>
        </div>

      </div>
    </div>
  );
}
