import React, { useState, useRef, useEffect } from 'react';
import { ColonyData, MediumType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { MousePointer2, PlusCircle, Trash2, Undo2, ArrowRight } from 'lucide-react';

interface Props {
  imageSrc: string;
  initialColonies: ColonyData[];
  medium: MediumType;
  aiAnalysis: string;
  onFinish: (finalColonies: ColonyData[]) => void;
}

export function ManualReview({ imageSrc, initialColonies, medium, aiAnalysis, onFinish }: Props) {
  const [colonies, setColonies] = useState<ColonyData[]>(initialColonies);
  const [history, setHistory] = useState<ColonyData[][]>([initialColonies]);
  const [mode, setMode] = useState<'select' | 'add' | 'delete'>('select');
  const [selectedClass, setSelectedClass] = useState<string>(medium === 'YPD' ? 'yeast' : 'lactobacillus');
  const containerRef = useRef<HTMLDivElement>(null);

  const pushHistory = (newColonies: ColonyData[]) => {
    setHistory((prev) => [...prev, newColonies]);
    setColonies(newColonies);
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setColonies(newHistory[newHistory.length - 1]);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coords to original image if needed, but for simplicity we assume canvas matches image overlay exactly
    // In a real app we'd need to scale x,y based on displayed vs natural size. Let's do simple proportional:
    const scaleX = (containerRef.current.querySelector('img') as HTMLImageElement)?.naturalWidth / rect.width || 1;
    const scaleY = (containerRef.current.querySelector('img') as HTMLImageElement)?.naturalHeight / rect.height || 1;
    
    const trueX = x * scaleX;
    const trueY = y * scaleY;

    if (mode === 'add') {
      const newColony: ColonyData = {
        id: uuidv4(),
        x: trueX,
        y: trueY,
        radius: 10,
        area: 314,
        circularity: 1,
        meanBrightness: 255,
        class: selectedClass as any,
        isManual: true,
      };
      pushHistory([...colonies, newColony]);
    }
  };

  const handleColonyClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (mode === 'delete') {
      pushHistory(colonies.filter(c => c.id !== id));
    } else if (mode === 'select') {
      // maybe change class
      const updated = colonies.map(c => c.id === id ? { ...c, class: selectedClass as any, isManual: true } : c);
      pushHistory(updated);
    }
  };

  const renderColony = (c: ColonyData) => {
    const scaleX = (containerRef.current?.querySelector('img') as HTMLImageElement)?.naturalWidth / (containerRef.current?.clientWidth || 1) || 1;
    
    let borderColor = 'border-red-400';
    let bgColor = 'bg-red-400/20';
    let label = '?';

    if (c.class === 'yeast') { borderColor = 'border-green-400'; bgColor = 'bg-green-400/20'; label = 'Y'; }
    else if (c.class === 'lactobacillus') { borderColor = 'border-green-400'; bgColor = 'bg-green-400/20'; label = 'L'; }
    else if (c.class === 'bacillus') { borderColor = 'border-blue-400'; bgColor = 'bg-blue-400/20'; label = 'B'; }

    return (
      <div 
        key={c.id}
        onClick={(e) => handleColonyClick(e, c.id)}
        className={`absolute rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer shadow-lg hover:z-10 flex items-center justify-center text-[8px] font-bold text-white/80 ${borderColor} ${mode === 'delete' ? 'bg-red-500/50 border-red-600' : bgColor}`}
        style={{
          left: `${(c.x / ((containerRef.current?.querySelector('img') as HTMLImageElement)?.naturalWidth || 1)) * 100}%`,
          top: `${(c.y / ((containerRef.current?.querySelector('img') as HTMLImageElement)?.naturalHeight || 1)) * 100}%`,
          width: `${Math.max((c.radius * 2) / scaleX, 16)}px`,
          height: `${Math.max((c.radius * 2) / scaleX, 16)}px`,
        }}
        title={`Class: ${c.class}`}
      >
        {label}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-0 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex-1 flex flex-col relative bg-slate-900 min-h-[500px]">
        {/* Toolbar Overlay */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <div className="flex bg-black/60 backdrop-blur border border-white/20 rounded text-white text-xs font-medium overflow-hidden">
            <button onClick={() => setMode('select')} className={`px-3 py-1.5 flex items-center gap-1 ${mode==='select'?'bg-white/20':''}`}><MousePointer2 size={14}/> 선택</button>
            <div className="w-px bg-white/20"></div>
            <button onClick={() => setMode('add')} className={`px-3 py-1.5 flex items-center gap-1 ${mode==='add'?'bg-white/20':''}`}><PlusCircle size={14}/> 추가</button>
            <div className="w-px bg-white/20"></div>
            <button onClick={() => setMode('delete')} className={`px-3 py-1.5 flex items-center gap-1 ${mode==='delete'?'bg-white/20':''}`}><Trash2 size={14}/> 삭제</button>
          </div>
          <button onClick={handleUndo} disabled={history.length <= 1} className="px-3 py-1.5 bg-black/60 backdrop-blur border border-white/20 rounded text-white text-xs font-medium disabled:opacity-50">
            <Undo2 size={14}/>
          </button>
          <select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)} className="px-2 bg-black/60 backdrop-blur border border-white/20 rounded text-white text-xs font-medium focus:outline-none">
            {medium === 'YPD' ? (
              <>
                <option value="yeast">Yeast</option>
                <option value="uncertain">Uncertain</option>
              </>
            ) : (
              <>
                <option value="lactobacillus">Lactobacillus</option>
                <option value="bacillus">Bacillus</option>
                <option value="uncertain">Uncertain</option>
              </>
            )}
          </select>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="relative aspect-square h-full max-h-[600px] border-4 border-dashed border-white/30 rounded-full flex items-center justify-center shadow-2xl overflow-hidden bg-slate-800" ref={containerRef} onClick={handleCanvasClick}>
            <div className="absolute inset-0 bg-[#0A1A2F] opacity-40 z-0"></div>
            <img src={imageSrc} className="w-full h-full object-cover mix-blend-screen opacity-90 z-0" alt="Analyzed" />
            <div className="absolute inset-0 z-10 pointer-events-none">
              {colonies.map(renderColony)}
            </div>
            {/* Dark outer ring overlay to enforce circle visually if img is square */}
            <div className="absolute inset-0 border-[20px] md:border-[40px] border-slate-900 pointer-events-none z-20 rounded-full"></div>
          </div>
        </div>
      </div>

      <aside className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">분석 요약 (Analysis Summary)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-[10px] text-slate-500 font-bold mb-1">초기 계수</div>
              <div className="text-2xl font-black text-slate-800">{initialColonies.length}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-[10px] text-blue-600 font-bold mb-1">최종 계수</div>
              <div className="text-2xl font-black text-blue-700">{colonies.length}</div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            {medium === 'YPD' ? (
              <>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Yeast</span><span className="font-bold">{colonies.filter(c=>c.class==='yeast').length}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Uncertain</span><span className="font-bold text-amber-500">{colonies.filter(c=>c.class==='uncertain').length}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Lactobacillus-like</span><span className="font-bold">{colonies.filter(c=>c.class==='lactobacillus').length}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Bacillus-like</span><span className="font-bold">{colonies.filter(c=>c.class==='bacillus').length}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Uncertain</span><span className="font-bold text-amber-500">{colonies.filter(c=>c.class==='uncertain').length}</span></div>
              </>
            )}
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI 검증 리포트 (QC AI)</h2>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
            {aiAnalysis}
          </div>
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-200 mt-auto">
          <button onClick={() => onFinish(colonies)} className="w-full py-2 bg-blue-600 text-white rounded font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            결과 계산 및 리포트 (Finish) <ArrowRight size={16}/>
          </button>
        </div>
      </aside>
    </div>
  );
}
