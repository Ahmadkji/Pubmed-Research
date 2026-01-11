
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import EvidenceMatrix from './components/EvidenceMatrix';
import { Icons } from './constants';
import { AppState } from './types';
import { performEvidenceSearch, getSearchSuggestions } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isLoading: false,
    activeTab: 'summary',
    selectedStudyIds: [],
    isComparingFullPage: false,
    history: ['Effect of Metformin on longevity', 'GLP-1 agonists side effects'],
    isSidebarOpen: true
  });
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      selectedStudyId: undefined, 
      selectedStudyIds: [],
      isComparingFullPage: false 
    }));

    try {
      const result = await performEvidenceSearch(searchQuery);
      setState(prev => ({
        ...prev,
        currentSearch: result,
        isLoading: false,
        history: [searchQuery, ...prev.history.slice(0, 4)]
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 5) {
      const sug = await getSearchSuggestions(val);
      setSuggestions(sug);
    } else {
      setSuggestions([]);
    }
  };

  const handleToggleMultiSelect = (id: string) => {
    setState(prev => {
      const isSelected = prev.selectedStudyIds.includes(id);
      return {
        ...prev,
        selectedStudyIds: isSelected 
          ? prev.selectedStudyIds.filter(sid => sid !== id)
          : [...prev.selectedStudyIds, id],
        selectedStudyId: undefined
      };
    });
  };

  const selectedStudy = state.currentSearch?.evidenceMatrix.find(s => s.id === state.selectedStudyId);
  const selectedStudies = state.currentSearch?.evidenceMatrix.filter(s => state.selectedStudyIds.includes(s.id)) || [];

  const getTrendData = () => {
    if (!state.currentSearch) return [];
    const counts: Record<number, number> = {};
    state.currentSearch.evidenceMatrix.forEach(s => {
      counts[s.year] = (counts[s.year] || 0) + 1;
    });
    return Object.keys(counts).map(year => ({ year, count: counts[parseInt(year)] })).sort((a,b) => parseInt(a.year) - parseInt(b.year));
  };

  const isDetailOpen = (!!state.selectedStudyId || state.selectedStudyIds.length > 0) && !state.isComparingFullPage;

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar isOpen={state.isSidebarOpen} onToggle={() => setState(p => ({...p, isSidebarOpen: !p.isSidebarOpen}))} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header Search Bar */}
        <header className="h-16 flex items-center px-4 lg:px-8 border-b bg-white gap-4 flex-shrink-0 z-20 shadow-sm">
          <button 
            onClick={() => setState(p => ({...p, isSidebarOpen: !p.isSidebarOpen}))} 
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <Icons.Menu />
          </button>
          
          <div className="flex-1 max-w-2xl relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Icons.Search />
            </div>
            <input 
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search medical evidence..."
              className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-gray-100 border-none focus:ring-2 focus:ring-[#009688] outline-none transition-all text-sm font-medium"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => { handleSearch(s); setSuggestions([]); }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors border-b last:border-b-0"
                  >
                    <Icons.TrendingUp />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="hidden sm:flex items-center gap-3 ml-auto">
            <button className="p-2 text-gray-400 hover:text-[#004d73] transition-colors"><Icons.Alert /></button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#009688] text-white rounded-xl font-semibold text-sm hover:bg-[#00796b] transition-all shadow-md active:scale-95">
              <span>Pro Search</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area */}
          <section className="flex-1 flex flex-col overflow-hidden relative min-w-[320px] lg:min-w-[600px]">
            
            {state.isComparingFullPage ? (
              <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <header className="p-6 border-b flex items-center justify-between bg-white shadow-sm z-10">
                  <div>
                    <button 
                      onClick={() => setState(p => ({...p, isComparingFullPage: false}))}
                      className="flex items-center gap-2 text-[#009688] font-bold text-sm hover:underline mb-1"
                    >
                      ← Back to Search Results
                    </button>
                    <h2 className="text-xl font-bold text-[#004d73]">Full Evidence Comparison Matrix</h2>
                  </div>
                </header>
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar flex p-8 gap-8 bg-gray-50/50">
                  {selectedStudies.map((study, idx) => (
                    <div key={study.id} className="w-[450px] flex-shrink-0 bg-white border border-gray-200 rounded-3xl shadow-xl flex flex-col overflow-hidden h-fit max-h-full">
                      <div className="p-6 border-b bg-gray-50/80">
                         <div className="flex justify-between items-start mb-4">
                           <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                             Study {idx + 1}: {study.type}
                           </span>
                         </div>
                         <h3 className="text-lg font-bold text-[#004d73] leading-snug mb-2">{study.title}</h3>
                         <p className="text-xs text-gray-500 font-medium">{study.authors} ({study.year})</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        <section>
                          <h4 className="text-[10px] font-bold text-[#009688] uppercase tracking-widest mb-3">Target Population</h4>
                          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm text-gray-700 leading-relaxed font-medium">
                            {study.population}
                          </div>
                        </section>
                        <section>
                          <h4 className="text-[10px] font-bold text-[#009688] uppercase tracking-widest mb-3">Clinical Intervention</h4>
                          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-sm text-gray-800 leading-relaxed font-semibold">
                            {study.intervention}
                          </div>
                        </section>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-y-auto p-4 lg:p-8 custom-scrollbar min-w-0">
                {!state.currentSearch && !state.isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
                    <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-[#009688] mb-6 shadow-sm border border-blue-100">
                      <Icons.Search />
                    </div>
                    <h2 className="text-2xl font-bold text-[#004d73] mb-2">Evidence-First Medical Search</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">Search across millions of peer-reviewed articles.</p>
                  </div>
                )}

                {state.isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                    <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#009688] animate-[loading_1.5s_infinite]" style={{ width: '40%' }}></div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 animate-pulse">Querying PubMed & synthesizing evidence...</p>
                  </div>
                )}

                {state.currentSearch && !state.isLoading && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="px-3 py-1 bg-teal-100 text-[#009688] text-[10px] font-bold uppercase tracking-widest rounded-full">Synthesized Answer</span>
                        </div>
                        <h2 className="text-xl font-bold text-[#004d73] mb-4 leading-snug">{state.currentSearch.query}</h2>
                        <p className="text-gray-700 leading-relaxed mb-6 text-[15px]">{state.currentSearch.summary}</p>
                      </div>
                    </div>

                    <div id="evidence-matrix">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <h3 className="text-lg font-bold text-[#004d73]">Evidence Matrix</h3>
                        <div className="flex gap-2">
                          {state.selectedStudyIds.length >= 2 && (
                            <button 
                              onClick={() => setState(p => ({...p, isComparingFullPage: true}))}
                              className="px-4 py-2 bg-[#009688] text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-teal-100"
                            >
                              <Icons.Matrix /> View Comparison ({state.selectedStudyIds.length})
                            </button>
                          )}
                        </div>
                      </div>
                      <EvidenceMatrix 
                        studies={state.currentSearch.evidenceMatrix} 
                        selectedStudyId={state.selectedStudyId}
                        selectedStudyIds={state.selectedStudyIds}
                        onSelectStudy={(id) => setState(p => ({...p, selectedStudyId: id, selectedStudyIds: [], isComparingFullPage: false}))} 
                        onToggleMultiSelect={handleToggleMultiSelect}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Background Overlay for Detail Drawer on medium screens */}
          {isDetailOpen && (
            <div 
              className="absolute inset-0 bg-black/5 backdrop-blur-[2px] z-20 lg:hidden animate-in fade-in duration-300" 
              onClick={() => setState(p => ({...p, selectedStudyId: undefined, selectedStudyIds: []}))}
            />
          )}

          {/* Right Detail Panel - Enhanced for Responsive Behavior */}
          {!state.isComparingFullPage && (
            <aside className={`
              fixed lg:static top-0 right-0 h-full bg-white flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
              shadow-[-20px_0_40px_rgba(0,0,0,0.05)] lg:shadow-none flex-shrink-0 z-30
              ${isDetailOpen 
                ? (state.selectedStudyIds.length > 1 ? 'w-full sm:w-[520px] lg:w-[480px]' : 'w-full sm:w-[420px] lg:w-[400px]') 
                : 'w-0 opacity-0 pointer-events-none translate-x-12'
              }
            `}>
              <div className="flex flex-col h-full min-w-[320px] overflow-hidden border-l border-gray-100">
                <header className="px-6 h-16 border-b flex items-center justify-between flex-shrink-0 bg-white sticky top-0 z-20">
                  <h3 className="font-bold text-[#004d73] flex items-center gap-2 truncate pr-4">
                    {state.selectedStudyIds.length > 1 ? (
                      <><Icons.Matrix /> Selection ({state.selectedStudyIds.length})</>
                    ) : (
                      <span className="truncate">{selectedStudy?.title || 'Study Details'}</span>
                    )}
                  </h3>
                  <button 
                    onClick={() => setState(p => ({...p, selectedStudyId: undefined, selectedStudyIds: []}))} 
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 shadow-sm"
                  >
                    <Icons.ChevronRight />
                  </button>
                </header>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                  {state.selectedStudyIds.length > 1 ? (
                    <div className="flex flex-col p-6 gap-6">
                      <div className="p-5 bg-teal-50 rounded-2xl border border-teal-100 flex items-center justify-between shadow-sm">
                        <span className="text-sm font-bold text-[#004d73]">{state.selectedStudyIds.length} Selected</span>
                        <button 
                          onClick={() => setState(p => ({...p, isComparingFullPage: true}))}
                          className="px-4 py-2 bg-[#009688] text-white text-xs font-bold rounded-lg shadow-md"
                        >
                          Full Page
                        </button>
                      </div>
                      <div className="flex flex-col divide-y divide-gray-100">
                        {selectedStudies.map((study, idx) => (
                          <div key={study.id} className="py-6 first:pt-0 group cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase mb-2 inline-block tracking-widest">
                              #{idx + 1} — {study.type}
                            </span>
                            <h4 className="text-sm font-bold leading-snug mb-2 text-gray-800 line-clamp-2">{study.title}</h4>
                            <button 
                              onClick={() => setState(p => ({...p, selectedStudyId: study.id, selectedStudyIds: []}))}
                              className="text-[#009688] text-xs font-bold flex items-center gap-1 hover:underline"
                            >
                              Individual Details <Icons.ChevronRight />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : selectedStudy ? (
                    <div className="p-6 space-y-6">
                      <div className="animate-in fade-in duration-300">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase mb-2 inline-block tracking-widest">
                          {selectedStudy.type}
                        </span>
                        <h4 className="text-lg font-bold leading-snug mb-2 text-[#004d73]">{selectedStudy.title}</h4>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">{selectedStudy.authors} — <span className="italic">{selectedStudy.journal} ({selectedStudy.year})</span></p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-widest">Grade</p>
                          <p className={`text-sm font-bold ${selectedStudy.grade === 'STRONG' ? 'text-teal-600' : 'text-amber-600'}`}>{selectedStudy.grade}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-widest">Risk</p>
                          <p className="text-sm font-bold text-gray-700">{selectedStudy.riskOfBias}</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-inner">
                          <h5 className="text-[10px] font-bold text-[#004d73] uppercase tracking-widest mb-2 opacity-60">Population</h5>
                          <p className="text-sm text-gray-700 font-medium leading-relaxed">{selectedStudy.population}</p>
                        </div>
                        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 shadow-inner">
                          <h5 className="text-[10px] font-bold text-[#004d73] uppercase tracking-widest mb-2 opacity-60">Intervention</h5>
                          <p className="text-sm text-gray-800 font-semibold leading-relaxed">{selectedStudy.intervention}</p>
                        </div>
                        <div className="pt-2">
                          <h5 className="text-[10px] font-bold text-[#004d73] uppercase tracking-widest mb-3 opacity-60">Study Abstract</h5>
                          <p className="text-sm text-gray-600 italic leading-relaxed border-l-4 border-teal-100 pl-4 py-1">"...{selectedStudy.abstractSnippet}..."</p>
                        </div>
                      </div>
                      
                      <div className="pt-8 border-t flex flex-col gap-3 pb-12">
                        <a 
                          href={selectedStudy.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#004d73] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                          View on PubMed <Icons.ChevronRight />
                        </a>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-100 text-[#004d73] rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95">
                          <Icons.Bookmark /> Save to Project
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      <button 
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-[#009688] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-50"
        onClick={() => { setQuery(''); setState(p => ({...p, selectedStudyId: undefined, selectedStudyIds: [], isComparingFullPage: false})) }}
      >
        <Icons.Search />
      </button>
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default App;
