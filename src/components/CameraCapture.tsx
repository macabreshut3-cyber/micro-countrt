import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCcw } from 'lucide-react';

interface Props {
  onCapture: (dataUrl: string) => void;
  onBack: () => void;
}

export function CameraCapture({ onCapture, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err: any) {
      setError('카메라를 시작할 수 없습니다. 권한을 확인하거나 파일 업로드를 사용해주세요.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        stopCamera();
        onCapture(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          stopCamera();
          onCapture(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">이미지 촬영 (Capture)</h2>
      </div>

      <div className="w-full bg-slate-50 p-3 rounded border border-slate-100 mb-6 text-xs text-slate-600 space-y-1">
        <p className="font-semibold text-slate-700 mb-2">촬영 가이드</p>
        <p>• 배지를 수직 위에서 평행하게 촬영하세요.</p>
        <p>• 빛 반사나 그림자가 생기지 않도록 밝은 곳에서 촬영하세요.</p>
        <p>• 원형 가이드 안에 배지 전체가 들어오도록 맞춰주세요.</p>
      </div>

      {error ? (
        <div className="w-full bg-red-50 text-red-600 p-4 rounded text-sm text-center border border-red-100 mb-6">
          {error}
        </div>
      ) : (
        <div className="relative w-full max-w-sm aspect-[3/4] bg-slate-900 rounded overflow-hidden flex items-center justify-center shadow-inner mb-6">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] aspect-square rounded-full border-2 border-white/50 border-dashed"></div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button onClick={onBack} className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded font-bold text-sm hover:bg-slate-50 transition-colors">
          이전 (Back)
        </button>
        {!error && (
          <button onClick={handleCapture} className="flex-[2] py-2 bg-blue-600 text-white rounded font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Camera size={16} /> <span>촬영 (Capture)</span>
          </button>
        )}
        <label className="flex-1 py-2 bg-slate-800 text-white rounded font-bold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer">
          <Upload size={16} /> <span>업로드</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
}
