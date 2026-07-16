import React from 'react';
import { MediumType } from '../types';

interface Props {
  onSelectMedium: (medium: MediumType) => void;
}

export function StartScreen({ onSelectMedium }: Props) {
  return (
    <div className="max-w-md mx-auto p-8 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col items-center">
      <h2 className="text-lg font-bold text-slate-800 mb-6">분석할 배지 종류를 선택하세요 (Select Medium)</h2>
      
      <div className="flex flex-col gap-4 w-full">
        <button 
          onClick={() => onSelectMedium('YPD')}
          className="w-full py-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-lg font-bold text-lg transition-colors flex flex-col items-center justify-center gap-1"
        >
          <span>YPD Agar</span>
          <span className="text-sm font-normal text-blue-600">(효모 / Yeast)</span>
        </button>
        <button 
          onClick={() => onSelectMedium('MRS')}
          className="w-full py-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-lg font-bold text-lg transition-colors flex flex-col items-center justify-center gap-1"
        >
          <span>MRS Blue Agar</span>
          <span className="text-sm font-normal text-indigo-600">(유산균·바실러스 / Lactobacillus·Bacillus)</span>
        </button>
      </div>
    </div>
  );
}
