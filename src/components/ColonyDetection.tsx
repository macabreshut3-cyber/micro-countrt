import React, { useEffect, useState } from 'react';
import { getCv } from '../opencvUtils';
import { ColonyData, SampleData } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from 'lucide-react';

interface Props {
  imageSrc: string;
  sampleData: SampleData;
  onComplete: (colonies: ColonyData[], aiAnalysis: string) => void;
  onError: (msg: string) => void;
}

export function ColonyDetection({ imageSrc, sampleData, onComplete, onError }: Props) {
  const [status, setStatus] = useState('OpenCV 초기화 중...');

  useEffect(() => {
    let isCancelled = false;

    const process = async () => {
      try {
        const cv = getCv();
        setStatus('이미지 전처리 및 콜로니 검출 중...');

        // Load image for OpenCV
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve) => (img.onload = resolve));

        const mat = cv.imread(img);
        const gray = new cv.Mat();
        cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);

        // Enhance contrast
        cv.equalizeHist(gray, gray);

        // Thresholding
        const thresh = new cv.Mat();
        // Since colonies could be lighter or darker depending on medium
        if (sampleData.medium === 'MRS') {
          // MRS is blue, colonies might be white/cream
          cv.threshold(gray, thresh, 150, 255, cv.THRESH_BINARY);
        } else {
          // YPD cream colored colonies on yellow agar, adaptive might be better
          cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
        }

        // Find contours
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        const detectedColonies: ColonyData[] = [];
        
        for (let i = 0; i < contours.size(); ++i) {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);
          
          // Filter tiny or huge contours
          if (area > 10 && area < 5000) {
            const circle = cv.minEnclosingCircle(contour);
            // Basic classification logic based on medium
            let cls = sampleData.medium === 'YPD' ? 'yeast' : 'uncertain';
            if (sampleData.medium === 'MRS') {
              cls = area > 100 ? 'lactobacillus' : 'bacillus'; // Dummy logic for default
            }

            detectedColonies.push({
              id: uuidv4(),
              x: circle.center.x,
              y: circle.center.y,
              radius: circle.radius,
              area: area,
              circularity: 1, // simplified
              meanBrightness: 255, // simplified
              class: cls as any,
              isManual: false
            });
          }
        }

        mat.delete();
        gray.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();

        setStatus('AI(Gemini) 품질 검증 및 2차 분석 중...');

        // Call our server API for Gemini QC
        const response = await fetch('/api/gemini/qc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageSrc, mode: sampleData.medium })
        });
        
        if (!response.ok) {
          throw new Error('Gemini API Error');
        }

        const data = await response.json();
        
        if (!isCancelled) {
          onComplete(detectedColonies, data.analysis || "AI 분석 결과를 불러올 수 없습니다.");
        }
      } catch (err: any) {
        if (!isCancelled) {
          onError(err.message || '분석 중 오류가 발생했습니다.');
        }
      }
    };

    // Wait a bit for UI to render
    setTimeout(process, 500);

    return () => {
      isCancelled = true;
    };
  }, [imageSrc, sampleData, onComplete, onError]);

  return (
    <div className="max-w-md mx-auto p-8 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col items-center justify-center min-h-[40vh]">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
      <h2 className="text-sm font-bold text-slate-800 tracking-tight">{status}</h2>
      <p className="text-slate-500 mt-2 text-[11px] text-center">
        잠시만 기다려주세요.<br/>서버 상황에 따라 약간의 시간이 소요될 수 있습니다.
      </p>
    </div>
  );
}
