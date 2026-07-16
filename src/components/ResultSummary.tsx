import React, { useRef } from 'react';
import { ColonyData, MediumType } from '../types';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  medium: MediumType;
  colonies: ColonyData[];
  calibratedImageSrc: string;
  onReset: () => void;
}

export function ResultSummary({ medium, colonies, calibratedImageSrc, onReset }: Props) {
  const finalCount = colonies.length;
  
  const warnings = [];
  if (finalCount < 30) warnings.push("TFTC (Too Few To Count, 30개 미만)");
  if (finalCount > 300) warnings.push("TNTC (Too Numerous To Count, 300개 초과)");

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-6">
      
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">분석 결과 요약 (Result Summary)</h2>
          
          <div className="bg-slate-900 p-6 rounded-xl text-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 pointer-events-none"></div>
            <div className="text-[11px] text-slate-400 font-medium mb-1 uppercase tracking-widest relative z-10">Total Colony Count</div>
            <div className="text-5xl md:text-6xl font-mono font-black text-white relative z-10 tracking-tight my-4">
              {finalCount}
            </div>
            <div className="text-slate-400 text-sm mt-2 relative z-10">Medium: {medium}</div>
          </div>
        </div>

        <div className="flex gap-3 mt-auto">
          <button onClick={onReset} className="w-full py-3 px-6 bg-blue-600 text-white rounded font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <RefreshCcw size={16} /> 처음으로 (Start Over)
          </button>
        </div>
      </div>

      <aside className="w-full md:w-72 bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col gap-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">상세 계수 현황</h2>
        
        <div className="space-y-3 bg-white p-4 rounded border border-slate-100 mb-2">
          {medium === 'YPD' ? (
            <>
              <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Yeast</span><span className="font-bold">{colonies.filter(c=>c.class==='yeast').length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Uncertain</span><span className="font-bold text-amber-500">{colonies.filter(c=>c.class==='uncertain').length}</span></div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Lactobacillus-like</span><span className="font-bold">{colonies.filter(c=>c.class==='lactobacillus').length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Bacillus-like</span><span className="font-bold">{colonies.filter(c=>c.class==='bacillus').length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Uncertain</span><span className="font-bold text-amber-500">{colonies.filter(c=>c.class==='uncertain').length}</span></div>
            </>
          )}
        </div>

        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">품질 경고 (QC Warnings)</h2>
        
        {warnings.length === 0 ? (
          <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="w-5 h-5 text-green-500 shrink-0">
              <svg fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-green-900">경고 없음</p>
              <p className="text-[10px] text-green-700">분석이 정상 범위 내에 있습니다.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="w-5 h-5 text-amber-500 shrink-0"><AlertTriangle size={20} /></div>
                <div>
                  <p className="text-[11px] font-bold text-amber-900">QC 경고</p>
                  <p className="text-[10px] text-amber-700">{w}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

    </div>
  );
}

