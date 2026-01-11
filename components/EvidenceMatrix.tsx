
import React, { useState } from 'react';
import { Study, EvidenceGrade } from '../types';
import { COLORS } from '../constants';

interface EvidenceMatrixProps {
  studies: Study[];
  selectedStudyId?: string;
  selectedStudyIds: string[];
  onSelectStudy: (id: string) => void;
  onToggleMultiSelect: (id: string) => void;
}

const EvidenceMatrix: React.FC<EvidenceMatrixProps> = ({ 
  studies, 
  selectedStudyId, 
  selectedStudyIds, 
  onSelectStudy, 
  onToggleMultiSelect 
}) => {
  const [sortKey, setSortKey] = useState<keyof Study>('year');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedStudies = [...studies].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const getGradeColor = (grade: EvidenceGrade) => {
    switch (grade) {
      case EvidenceGrade.STRONG: return 'text-teal-600 bg-teal-50 border-teal-100';
      case EvidenceGrade.MODERATE: return 'text-blue-600 bg-blue-50 border-blue-100';
      case EvidenceGrade.WEAK: return 'text-amber-600 bg-amber-50 border-amber-100';
      case EvidenceGrade.CONFLICTING: return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const handleSort = (key: keyof Study) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm custom-scrollbar relative">
      <table className="min-w-full divide-y divide-gray-200 table-auto border-separate border-spacing-0">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-4 text-left w-10 border-b">
              <span className="sr-only">Select</span>
            </th>
            {['Year', 'Study Type', 'Population', 'Outcome', 'Grade'].map((header) => {
              const key = header.toLowerCase().replace(' ', '') as keyof Study;
              return (
                <th 
                  key={header}
                  onClick={() => handleSort(key)}
                  className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap border-b"
                >
                  <div className="flex items-center gap-1.5">
                    {header}
                    {sortKey === key && (
                      <span className="text-[#009688]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sortedStudies.map((study) => {
            const isMultiSelected = selectedStudyIds.includes(study.id);
            const isSingleSelected = selectedStudyId === study.id;
            
            return (
              <tr 
                key={study.id} 
                className={`transition-all group relative cursor-pointer ${
                  isSingleSelected 
                    ? 'bg-teal-50/50 shadow-[inset_4px_0_0_0_#009688]' 
                    : isMultiSelected 
                      ? 'bg-blue-50/40 shadow-[inset_4px_0_0_0_#3b82f6]' 
                      : 'hover:bg-gray-50/80'
                }`}
                onClick={() => onSelectStudy(study.id)}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    checked={isMultiSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleMultiSelect(study.id);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-[#009688] focus:ring-[#009688] cursor-pointer accent-[#009688]"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs font-mono font-bold text-gray-900">
                  {study.year}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600">
                  <span className="px-2 py-1 rounded bg-gray-100 text-[9px] font-bold uppercase group-hover:bg-gray-200 transition-colors tracking-tighter">
                    {study.type}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-gray-600 max-w-[180px] lg:max-w-xs truncate font-medium">
                  {study.population}
                </td>
                <td className="px-4 py-4 text-xs font-bold text-gray-900 max-w-[180px] lg:max-w-xs truncate">
                  {study.outcome}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${getGradeColor(study.grade)}`}>
                    {study.grade}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default EvidenceMatrix;
