import React, { useState } from 'react';
import { SampleData, MediumType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onSubmit: (data: SampleData) => void;
}

export function SampleForm({ onSubmit }: Props) {
  const [formData, setFormData] = useState<Partial<SampleData>>({
    sampleId: '',
    productName: '',
    samplingDate: new Date().toISOString().split('T')[0],
    analyst: '',
    medium: 'YPD',
    dilutionFactor: 1,
    platedVolume: 1.0,
    incubationTemperature: 30,
    incubationTime: 48,
    memo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: uuidv4(),
      sampleId: formData.sampleId || `SMP-${Date.now()}`,
      productName: formData.productName || '',
      samplingDate: formData.samplingDate || '',
      analyst: formData.analyst || 'Unknown',
      medium: formData.medium as MediumType,
      dilutionFactor: formData.dilutionFactor || 1,
      platedVolume: formData.platedVolume || 1.0,
      incubationTemperature: formData.incubationTemperature || 30,
      incubationTime: formData.incubationTime || 48,
      memo: formData.memo || '',
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-slate-200 rounded-lg shadow-sm">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">샘플 정보 입력 (Sample Info)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">샘플 ID</label>
            <input type="text" name="sampleId" value={formData.sampleId} onChange={handleChange} required
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">제품명</label>
            <input type="text" name="productName" value={formData.productName} onChange={handleChange} required
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">채취 일자</label>
            <input type="date" name="samplingDate" value={formData.samplingDate} onChange={handleChange} required
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">분석자</label>
            <input type="text" name="analyst" value={formData.analyst} onChange={handleChange} required
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">배지 종류</label>
            <select name="medium" value={formData.medium} onChange={handleChange}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500">
              <option value="YPD">YPD (효모)</option>
              <option value="MRS">MRS Blue (유산균/바실러스)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">희석 배수</label>
            <input type="number" name="dilutionFactor" value={formData.dilutionFactor} onChange={handleChange} min="1" required
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">도말량 (mL)</label>
            <input type="number" step="0.1" name="platedVolume" value={formData.platedVolume} onChange={handleChange} required
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">배양 온도 (°C)</label>
              <input type="number" name="incubationTemperature" value={formData.incubationTemperature} onChange={handleChange} required
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">배양 시간 (h)</label>
              <input type="number" name="incubationTime" value={formData.incubationTime} onChange={handleChange} required
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500">메모</label>
          <textarea name="memo" value={formData.memo} onChange={handleChange} rows={3}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"></textarea>
        </div>
        <div className="pt-4 border-t border-slate-100 mt-6">
          <button type="submit" className="w-full py-2 bg-slate-800 text-white rounded font-bold text-sm hover:bg-black transition-colors">
            다음 단계로 진행 (Next)
          </button>
        </div>
      </form>
    </div>
  );
}
