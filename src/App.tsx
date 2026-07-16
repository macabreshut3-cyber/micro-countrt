import React, { useState, useEffect } from 'react';
import { AppState, SampleData, ColonyData } from './types';
import { SampleForm } from './components/SampleForm';
import { CameraCapture } from './components/CameraCapture';
import { PlateCalibration } from './components/PlateCalibration';
import { ColonyDetection } from './components/ColonyDetection';
import { ManualReview } from './components/ManualReview';
import { ResultSummary } from './components/ResultSummary';

export default function App() {
  const [state, setState] = useState<AppState>({
    step: 'form',
    sampleData: null,
    rawImageSrc: null,
    calibratedImageSrc: null,
    colonies: [],
    aiAnalysisText: null,
    qcWarnings: [],
  });

  // Keep OpenCV loaded
  useEffect(() => {
    // Just a passive wait, we handle it in detection component
  }, []);

  const handleFormSubmit = (data: SampleData) => {
    setState((s) => ({ ...s, sampleData: data, step: 'camera' }));
  };

  const handleCapture = (dataUrl: string) => {
    setState((s) => ({ ...s, rawImageSrc: dataUrl, step: 'calibration' }));
  };

  const handleCalibrationConfirm = (croppedBase64: string) => {
    setState((s) => ({ ...s, calibratedImageSrc: croppedBase64, step: 'detection' }));
  };

  const handleDetectionComplete = (colonies: ColonyData[], aiAnalysis: string) => {
    setState((s) => ({ ...s, colonies, aiAnalysisText: aiAnalysis, step: 'review' }));
  };

  const handleDetectionError = (err: string) => {
    alert("분석 오류: " + err);
    setState((s) => ({ ...s, step: 'calibration' }));
  };

  const handleReviewFinish = (finalColonies: ColonyData[]) => {
    setState((s) => ({ ...s, colonies: finalColonies, step: 'result' }));
  };

  const reset = () => {
    setState({
      step: 'form',
      sampleData: null,
      rawImageSrc: null,
      calibratedImageSrc: null,
      colonies: [],
      aiAnalysisText: null,
      qcWarnings: [],
    });
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
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 hidden sm:flex">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> 시스템 정상
          </div>
          <div className="text-sm font-semibold text-blue-600">
            Step: {state.step}
          </div>
        </div>
      </header>
      
      <main className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto w-full h-full">
          <div className="min-h-full p-4 md:p-8">
            {state.step === 'form' && (
              <SampleForm onSubmit={handleFormSubmit} />
            )}
            
            {state.step === 'camera' && (
              <CameraCapture 
                onCapture={handleCapture} 
                onBack={() => setState((s) => ({ ...s, step: 'form' }))} 
              />
            )}

            {state.step === 'calibration' && state.rawImageSrc && (
              <PlateCalibration 
                imageSrc={state.rawImageSrc}
                onConfirm={handleCalibrationConfirm}
                onBack={() => setState((s) => ({ ...s, step: 'camera' }))}
              />
            )}

            {state.step === 'detection' && state.calibratedImageSrc && state.sampleData && (
              <ColonyDetection
                imageSrc={state.calibratedImageSrc}
                sampleData={state.sampleData}
                onComplete={handleDetectionComplete}
                onError={handleDetectionError}
              />
            )}

            {state.step === 'review' && state.calibratedImageSrc && state.sampleData && (
              <ManualReview
                imageSrc={state.calibratedImageSrc}
                sampleData={state.sampleData}
                initialColonies={state.colonies}
                aiAnalysis={state.aiAnalysisText || ''}
                onFinish={handleReviewFinish}
              />
            )}

            {state.step === 'result' && state.calibratedImageSrc && state.sampleData && (
              <ResultSummary
                sampleData={state.sampleData}
                colonies={state.colonies}
                calibratedImageSrc={state.calibratedImageSrc}
                onReset={reset}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="h-12 bg-slate-100 border-t border-slate-200 px-6 flex items-center shrink-0">
        <p className="text-[10px] text-slate-500 leading-tight w-full">
          <strong>주의:</strong> 본 결과는 배지 이미지의 집락 형태를 기반으로 한 계수 및 추정 분류 결과이며, 균종 동정 결과가 아닙니다. 모든 결과는 숙련된 분석자의 최종 검토를 거쳐야 합니다.
        </p>
      </footer>
    </div>
  );
}

