import React, { useRef, useState, useEffect } from 'react';

interface Props {
  imageSrc: string;
  onConfirm: (croppedImageBase64: string) => void;
  onBack: () => void;
}

export function PlateCalibration({ imageSrc, onConfirm, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [circle, setCircle] = useState({ x: 50, y: 50, r: 40 }); // Percentages

  const onImageLoad = () => {
    if (imageRef.current) {
      setImgSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  const handleCrop = () => {
    if (!imageRef.current) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Actual pixels
    const cx = (circle.x / 100) * imgSize.width;
    const cy = (circle.y / 100) * imgSize.height;
    const r = (circle.r / 100) * Math.min(imgSize.width, imgSize.height);

    const size = r * 2;
    canvas.width = size;
    canvas.height = size;

    // Draw circular crop
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      imageRef.current,
      cx - r, cy - r, size, size,
      0, 0, size, size
    );

    onConfirm(canvas.toDataURL('image/jpeg', 0.95));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">영역 맞추기 (Calibration)</h2>
      
      <div className="relative w-full bg-slate-900 overflow-hidden rounded select-none flex items-center justify-center" ref={containerRef}>
        <img 
          ref={imageRef} 
          src={imageSrc} 
          onLoad={onImageLoad} 
          className="max-h-[50vh] object-contain block pointer-events-none opacity-80" 
          alt="Original" 
        />
        {/* Overlay SVG */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <mask id="mask">
                <rect width="100%" height="100%" fill="white" />
                <circle cx={`${circle.x}%`} cy={`${circle.y}%`} r={`${circle.r}%`} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(15,23,42,0.8)" mask="url(#mask)" />
            <circle cx={`${circle.x}%`} cy={`${circle.y}%`} r={`${circle.r}%`} fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="4 4" />
          </svg>
        </div>
      </div>

      <div className="mt-6 space-y-4 bg-slate-50 p-4 rounded border border-slate-100">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500">크기 (Radius)</label>
          <input type="range" min="10" max="100" value={circle.r} onChange={(e) => setCircle({...circle, r: Number(e.target.value)})} className="w-full accent-blue-600" />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500">가로 위치 (X)</label>
          <input type="range" min="0" max="100" value={circle.x} onChange={(e) => setCircle({...circle, x: Number(e.target.value)})} className="w-full accent-blue-600" />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500">세로 위치 (Y)</label>
          <input type="range" min="0" max="100" value={circle.y} onChange={(e) => setCircle({...circle, y: Number(e.target.value)})} className="w-full accent-blue-600" />
        </div>
      </div>

      <div className="flex gap-3 w-full mt-6">
        <button onClick={onBack} className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded font-bold text-sm hover:bg-slate-50 transition-colors">
          다시 촬영 (Retake)
        </button>
        <button onClick={handleCrop} className="flex-1 py-2 bg-blue-600 text-white rounded font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-colors">
          영역 확정 (Confirm)
        </button>
      </div>
    </div>
  );
}
