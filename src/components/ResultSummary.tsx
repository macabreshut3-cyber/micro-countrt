import React, { useRef } from 'react';
import { ColonyData, SampleData } from '../types';
import { AlertTriangle, Download, RefreshCcw } from 'lucide-react';

interface Props {
  sampleData: SampleData;
  colonies: ColonyData[];
  calibratedImageSrc: string;
  onReset: () => void;
}

export function ResultSummary({ sampleData, colonies, calibratedImageSrc, onReset }: Props) {
  const finalCount = colonies.length;
  let cfuPerMl = 0;
  if (sampleData.platedVolume > 0) {
    cfuPerMl = (finalCount * sampleData.dilutionFactor) / sampleData.platedVolume;
  }

  const warnings = [];
  if (finalCount < 30) warnings.push("TFTC (Too Few To Count, 30개 미만)");
  if (finalCount > 300) warnings.push("TNTC (Too Numerous To Count, 300개 초과)");

  const handleExportCSV = () => {
    let csv = "Sample ID,Product Name,Date,Analyst,Medium,Dilution,Volume(mL),Count,CFU/mL\n";
    csv += `${sampleData.sampleId},${sampleData.productName},${sampleData.samplingDate},${sampleData.analyst},${sampleData.medium},${sampleData.dilutionFactor},${sampleData.platedVolume},${finalCount},${cfuPerMl.toFixed(0)}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result_${sampleData.sampleId}.csv`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-6">
      
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">분석 결과 요약 (Result Summary)</h2>
          
          <div className="bg-slate-900 p-6 rounded-xl text-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 pointer-events-none"></div>
            <div className="text-[11px] text-slate-400 font-medium mb-1 uppercase tracking-widest relative z-10">Calculated CFU/mL</div>
            <div className="text-4xl md:text-5xl font-mono font-black text-white relative z-10 tracking-tight">
              {cfuPerMl.toExponential(2).replace('e+', ' × 10').split(' × 10').map((part, i) => i === 1 ? <sup key={i}>{part}</sup> : part)}
            </div>
            <div className="text-slate-400 text-xs mt-2 relative z-10">Raw count: {finalCount} CFU</div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">샘플 정보 (Sample Details)</h2>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">샘플 ID</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">{sampleData.sampleId}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">배지 종류</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">{sampleData.medium}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">제품명</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">{sampleData.productName}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">희석 배수 / 도말량</div>
              <div className="text-sm font-medium text-slate-800 bg-slate-50 px-3 py-1.5 rounded border border-slate-100">10^{Math.log10(sampleData.dilutionFactor)} / {sampleData.platedVolume}mL</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-auto">
          <button onClick={handleExportCSV} className="flex-1 py-2 bg-blue-600 text-white rounded font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Download size={16} /> CSV 내보내기
          </button>
          <button onClick={onReset} className="py-2 px-6 bg-slate-800 text-white rounded font-bold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2">
            <RefreshCcw size={16} /> 처음으로
          </button>
        </div>
      </div>

      <aside className="w-full md:w-72 bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col gap-4">
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
        
        <div className="mt-auto pt-4 border-t border-slate-200">
          <div className="bg-red-50 text-red-800 p-3 rounded text-[10px] border border-red-100 leading-relaxed font-medium">
            <strong>주의:</strong> 본 결과는 배지 이미지의 집락 형태를 기반으로 한 계수 및 추정 분류 결과이며, 균종 동정 결과가 아닙니다.
          </div>
        </div>
      </aside>

    </div>
  );
}
