import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, RefreshCcw, Loader2, ArrowLeft, ImagePlus } from 'lucide-react';
import { getCv } from './opencvUtils';
import { v4 as uuidv4 } from 'uuid';

type MediumType = 'YPD' | 'MRS';
type ColonyClass = 'yeast' | 'lactobacillus' | 'bacillus' | 'uncertain';

interface ColonyData {
  id: string;
  x: number;
  y: number;
  radius: number;
  class: ColonyClass;
}

export default function App() {
  const [step, setStep] = useState<'home' | 'camera' | 'processing' | 'result'>('home');
  const [medium, setMedium] = useState<MediumType>('YPD');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [colonies, setColonies] = useState<ColonyData[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (step === 'result' && imageSrc) {
      drawResult();
    }
  }, [step, imageSrc, colonies]);

  const drawResult = () => {
    const canvas = resultCanvasRef.current;
    if (!canvas || !imageSrc) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      colonies.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, Math.max(c.radius, 10), 0, 2 * Math.PI);
        
        if (c.class === 'yeast') { ctx.strokeStyle = '#4ade80'; ctx.fillStyle = 'rgba(74,222,128,0.3)'; }
        else if (c.class === 'lactobacillus') { ctx.strokeStyle = '#60a5fa'; ctx.fillStyle = 'rgba(96,165,250,0.3)'; }
        else if (c.class === 'bacillus') { ctx.strokeStyle = '#c084fc'; ctx.fillStyle = 'rgba(192,132,252,0.3)'; }
        else { ctx.strokeStyle = '#f87171'; ctx.fillStyle = 'rgba(248,113,113,0.3)'; }

        ctx.lineWidth = img.naturalWidth > 1000 ? 6 : 3;
        ctx.fill();
        ctx.stroke();
      });
    };
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStep('camera');
    } catch (err: any) {
      alert('카메라를 시작할 수 없습니다. 권한을 확인하거나 파일 업로드를 사용해주세요.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
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
        processImage(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (src: string) => {
    setStep('processing');
    setImageSrc(src);
    
    setTimeout(async () => {
      try {
        const cv = getCv();
        const img = new Image();
        img.src = src;
        await new Promise((resolve) => (img.onload = resolve));

        const mat = cv.imread(img);
        const gray = new cv.Mat();
        cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);
        
        cv.equalizeHist(gray, gray);

        const thresh = new cv.Mat();
        if (medium === 'MRS') {
          cv.threshold(gray, thresh, 120, 255, cv.THRESH_BINARY);
        } else {
          cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, 2);
        }

        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        const detected: ColonyData[] = [];
        for (let i = 0; i < contours.size(); ++i) {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);
          
          if (area > 20 && area < 10000) {
            const circle = cv.minEnclosingCircle(contour);
            let cls: ColonyClass = medium === 'YPD' ? 'yeast' : 'uncertain';
            
            if (medium === 'MRS') {
              cls = area > 150 ? 'lactobacillus' : 'bacillus'; 
            }

            detected.push({
              id: uuidv4(),
              x: circle.center.x,
              y: circle.center.y,
              radius: circle.radius,
              class: cls
            });
          }
        }

        mat.delete(); gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
        setColonies(detected);
        setStep('result');
      } catch (err) {
        console.error(err);
        alert("이미지 처리 중 오류가 발생했습니다. OpenCV가 아직 로드되지 않았을 수 있습니다.");
        setStep('home');
      }
    }, 500);
  };

  const reset = () => {
    setImageSrc(null);
    setColonies([]);
    setStep('home');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">
            Microbial Colony Counter QC <span className="font-normal text-slate-400 ml-2 hidden sm:inline">| 미생물 집락 계수 QC</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-blue-600">
            {step === 'home' ? '대기 중' : step === 'camera' ? '촬영 중' : step === 'processing' ? '분석 중' : '결과'}
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto w-full h-full p-4 md:p-8">
          
          {step === 'home' && (
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg shadow-sm p-6 mt-10">
              <h2 className="text-sm font-bold text-slate-800 mb-6 text-center">배지 종류를 선택하고 이미지를 업로드하세요</h2>
              
              <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setMedium('YPD')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-bold transition-colors ${medium === 'YPD' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  YPD (효모)
                </button>
                <button 
                  onClick={() => setMedium('MRS')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-bold transition-colors ${medium === 'MRS' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  MRS (유산균/바실러스)
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <button onClick={startCamera} className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Camera size={20} /> 카메라로 촬영
                </button>
                
                <label className="w-full py-4 bg-slate-800 text-white rounded-lg font-bold shadow-lg shadow-slate-900/20 hover:bg-black transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <ImagePlus size={20} /> 갤러리에서 업로드
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {step === 'camera' && (
            <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col items-center">
              <div className="w-full bg-slate-50 p-3 rounded border border-slate-100 mb-4 text-xs text-slate-600 space-y-1">
                <p>• 배지를 수직 위에서 평행하게 촬영하세요.</p>
                <p>• 빛 반사나 그림자가 생기지 않도록 밝은 곳에서 촬영하세요.</p>
              </div>
              <div className="relative w-full aspect-[3/4] bg-slate-900 rounded overflow-hidden flex items-center justify-center shadow-inner mb-6">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[80%] aspect-square rounded-full border-2 border-white/50 border-dashed"></div>
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex gap-4 w-full">
                <button onClick={() => { stopCamera(); setStep('home'); }} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft size={16} /> 취소
                </button>
                <button onClick={handleCapture} className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Camera size={20} /> 촬영
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
              <h2 className="text-lg font-bold text-slate-800">콜로니 분석 중...</h2>
              <p className="text-slate-500 mt-2 text-sm text-center">이미지를 처리하고 있습니다.</p>
            </div>
          )}

          {step === 'result' && imageSrc && (
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
              <div className="flex-[2] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex items-center justify-center relative min-h-[400px]">
                <canvas ref={resultCanvasRef} className="max-w-full max-h-[70vh] object-contain"></canvas>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">분석 결과 요약 (Result Summary)</h2>
                  
                  <div className="bg-slate-900 p-6 rounded-xl text-center shadow-lg relative overflow-hidden mb-6">
                    <div className="absolute inset-0 bg-blue-600/10 pointer-events-none"></div>
                    <div className="text-[11px] text-slate-400 font-medium mb-1 uppercase tracking-widest relative z-10">Total CFU</div>
                    <div className="text-5xl font-mono font-black text-white relative z-10 tracking-tight">{colonies.length}</div>
                  </div>

                  <div className="space-y-3">
                    {medium === 'YPD' ? (
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400"></span> 효모 (Yeast)</span>
                        <span className="font-bold text-slate-800">{colonies.filter(c => c.class === 'yeast').length}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400"></span> Lactobacillus-like</span>
                          <span className="font-bold text-slate-800">{colonies.filter(c => c.class === 'lactobacillus').length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-400"></span> Bacillus-like</span>
                          <span className="font-bold text-slate-800">{colonies.filter(c => c.class === 'bacillus').length}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3 mt-3">
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400"></span> 기타 / 미분류 (Uncertain)</span>
                      <span className="font-bold text-slate-800">{colonies.filter(c => c.class === 'uncertain').length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 text-red-800 p-3 rounded text-[10px] border border-red-100 leading-relaxed font-medium mt-auto">
                  <strong>주의:</strong> 본 결과는 배지 이미지의 집락 형태를 기반으로 한 계수 및 추정 분류 결과이며, 균종 동정 결과가 아닙니다.
                </div>

                <button onClick={reset} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-900/20 hover:bg-black transition-colors flex items-center justify-center gap-2">
                  <RefreshCcw size={20} /> 새로운 분석 시작
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

