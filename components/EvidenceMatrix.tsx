
import React, { useState } from 'react';
import { Study, EvidenceGrade } from '../types';
import { COLORS } from '../constants';

interface EvidenceMatrixProps {
  studies: Study[];
  onSelectStudy: (id: string) => void;
}

const EvidenceMatrix: React.FC<EvidenceMatrixProps> = ({ studies, onSelectStudy }) => {
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
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Year', 'Study Type', 'Population', 'Outcome', 'Grade'].map((header) => {
              const key = header.toLowerCase().replace(' ', '') as keyof Study;
              return (
                <th 
                  key={header}
                  onClick={() => handleSort(key)}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    {header}
                    {sortKey === key && (
                      <span>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedStudies.map((study) => (
            <tr 
              key={study.id} 
              onClick={() => onSelectStudy(study.id)}
              className="hover:bg-blue-50/50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{study.year}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <span className="px-2 py-1 rounded-md bg-gray-100 text-[10px] font-bold uppercase">{study.type}</span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{study.population}</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate">{study.outcome}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getGradeColor(study.grade)}`}>
                  {study.grade}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EvidenceMatrix;
