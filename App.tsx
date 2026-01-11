
import React, { useState, useMemo } from 'react';
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
    detailTab: 'overview',
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
      const newSelectedIds = isSelected 
        ? prev.selectedStudyIds.filter(sid => sid !== id)
        : [...prev.selectedStudyIds, id];
      
      return {
        ...prev,
        selectedStudyIds: newSelectedIds,
        // When checking/unchecking, we clear single focus to avoid confusion,
        // but the rendering logic will now fallback to the first checkbox if length is 1.
        selectedStudyId: undefined 
      };
    });
  };

  const handleSelectStudy = (id: string) => {
    setState(prev => ({
      ...prev,
      selectedStudyId: id,
      // If the user clicks a specific row, we clear multi-select 
      // UNLESS they are already in a multi-select workflow.
      // Standard UX: single click = focus, checkbox = collect.
      selectedStudyIds: prev.selectedStudyIds.length > 0 ? prev.selectedStudyIds : [],
      isComparingFullPage: false
    }));
  };

  // Derived state for the focused study
  const effectiveFocusedId = state.selectedStudyId || (state.selectedStudyIds.length === 1 ? state.selectedStudyIds[0] : undefined);
  const selectedStudy = useMemo(() => 
    state.currentSearch?.evidenceMatrix.find(s => s.id === effectiveFocusedId),
    [state.currentSearch, effectiveFocusedId]
  );
  
  const selectedStudies = useMemo(() => 
    state.currentSearch?.evidenceMatrix.filter(s => state.selectedStudyIds.includes(s.id)) || [],
    [state.currentSearch, state.selectedStudyIds]
  );

  const getTrendData = () => {
    if (!state.currentSearch) return [];
    const counts: Record<number, number> = {};
    state.currentSearch.evidenceMatrix.forEach(s => {
      counts[s.year] = (counts[s.year] || 0) + 1;
    });
    return Object.keys(counts).map(year => ({ year, count: counts[parseInt(year)] })).sort((a,b) => parseInt(a.year) - parseInt(b.year));
  };

  const isDetailOpen = (!!effectiveFocusedId || state.selectedStudyIds.length > 0) && !state.isComparingFullPage;

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
          </div>
          
          <div className="hidden sm:flex items-center gap-3 ml-auto">
            <button className="p-2 text-gray-400 hover:text-[#004d73] transition-colors"><Icons.Alert /></button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#009688] text-white rounded-xl font-semibold text-sm hover:bg-[#00796b] transition-all shadow-md active:scale-95">
              <span>Pro Search</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 flex overflow-hidden relative">
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
                {state.isLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                    <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#009688] animate-[loading_1.5s_infinite]" style={{ width: '40%' }}></div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 animate-pulse">Querying PubMed & synthesizing evidence...</p>
                  </div>
                ) : state.currentSearch ? (
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

                    <div id="evidence-matrix" className="relative">
                      {/* Selection Banner - Show if items are selected OR if single focus exists */}
                      {state.selectedStudyIds.length > 0 && (
                        <div className="sticky top-0 z-20 mb-4 animate-in slide-in-from-top-4 duration-300">
                          <div className="bg-[#004d73] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-white/10">
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-[#009688] flex items-center justify-center font-bold text-sm shadow-inner">
                                {state.selectedStudyIds.length}
                              </div>
                              <div>
                                <p className="text-sm font-bold">Comparison Mode Active</p>
                                <p className="text-[10px] text-blue-200 uppercase tracking-widest font-medium">Select more to compare or launch full analysis</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => setState(p => ({...p, selectedStudyIds: []}))}
                                className="text-xs font-bold text-blue-200 hover:text-white transition-colors"
                              >
                                Clear
                              </button>
                              {state.selectedStudyIds.length > 1 && (
                                <button 
                                  onClick={() => setState(p => ({...p, isComparingFullPage: true}))}
                                  className="px-4 py-2 bg-[#009688] hover:bg-[#00796b] text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
                                >
                                  <Icons.Matrix /> Launch Full Analysis
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <h3 className="text-lg font-bold text-[#004d73]">Evidence Matrix</h3>
                      </div>
                      <EvidenceMatrix 
                        studies={state.currentSearch.evidenceMatrix} 
                        selectedStudyId={effectiveFocusedId}
                        selectedStudyIds={state.selectedStudyIds}
                        onSelectStudy={handleSelectStudy} 
                        onToggleMultiSelect={handleToggleMultiSelect}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-12">
                    <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-[#009688] mb-6 shadow-sm border border-blue-100">
                      <Icons.Search />
                    </div>
                    <h2 className="text-2xl font-bold text-[#004d73] mb-2">Evidence-First Medical Search</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">Search across millions of peer-reviewed articles.</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Right Detail Panel */}
          {!state.isComparingFullPage && (
            <aside className={`
              flex-shrink-0 transition-all duration-500 ease-in-out border-l bg-white flex flex-col z-30
              ${isDetailOpen ? 'w-96 lg:w-[480px]' : 'w-0 opacity-0 overflow-hidden'}
            `}>
              <div className="flex flex-col h-full w-96 lg:w-[480px] overflow-hidden">
                <header className="px-6 h-16 border-b flex items-center justify-between bg-white sticky top-0 z-20">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <h3 className="font-bold text-[#004d73] truncate">
                      {state.selectedStudyIds.length > 1 ? (
                        <span className="flex items-center gap-2"><Icons.Matrix /> Comparison Mode</span>
                      ) : (
                        'Study Inspector'
                      )}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setState(p => ({...p, selectedStudyId: undefined, selectedStudyIds: []}))} 
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                  >
                    <Icons.ChevronRight />
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {state.selectedStudyIds.length > 1 ? (
                    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
                      <div className="p-6 bg-gray-50/50 border-b space-y-3">
                        <p className="text-xs font-semibold text-gray-500">Comparing PICO factors across {state.selectedStudyIds.length} records.</p>
                      </div>
                      <div className="flex-1 overflow-x-auto custom-scrollbar">
                         <div className="flex p-6 gap-4 min-w-max">
                            {selectedStudies.map((study, idx) => (
                              <div key={study.id} className="w-72 flex-shrink-0 flex flex-col gap-6 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-[#009688] transition-all relative group">
                                <div className="absolute top-4 right-4">
                                  <button onClick={() => handleToggleMultiSelect(study.id)} className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100"><Icons.Check /></button>
                                </div>
                                <div>
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase tracking-widest mb-2 inline-block">
                                    {study.type} • {study.year}
                                  </span>
                                  <h4 className="text-sm font-bold leading-tight text-[#004d73] line-clamp-2">{study.title}</h4>
                                </div>
                                <div className="space-y-4">
                                   <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                      <p className="text-[9px] text-[#009688] font-bold uppercase tracking-widest mb-1">Population</p>
                                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{study.population}</p>
                                   </div>
                                   <div className="p-3 bg-blue-50/20 rounded-xl border border-blue-50">
                                      <p className="text-[9px] text-[#004d73] font-bold uppercase tracking-widest mb-1">Intervention</p>
                                      <p className="text-xs text-gray-800 font-semibold leading-relaxed line-clamp-3">{study.intervention}</p>
                                   </div>
                                </div>
                                <div className="mt-auto pt-4 border-t flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-teal-600">GRADE: {study.grade}</span>
                                  <button onClick={() => handleSelectStudy(study.id)} className="text-[10px] font-bold text-[#009688] hover:underline">Inspect →</button>
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    </div>
                  ) : selectedStudy ? (
                    <div className="p-6">
                      {/* Tabs */}
                      <div className="flex border-b bg-gray-50/50 p-1 mb-6 rounded-xl">
                        {['overview', 'abstract', 'outcomes'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setState(p => ({...p, detailTab: tab as any}))}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                              state.detailTab === tab ? 'bg-white text-[#004d73] shadow-sm' : 'text-gray-400'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {state.detailTab === 'overview' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                          <div>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase tracking-widest mb-2 inline-block">{selectedStudy.type}</span>
                            <h4 className="text-lg font-bold leading-tight text-[#004d73] mb-2">{selectedStudy.title}</h4>
                            <p className="text-xs text-gray-500 font-medium">{selectedStudy.authors} — <span className="italic">{selectedStudy.journal} ({selectedStudy.year})</span></p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Evidence Grade</p>
                              <p className={`text-xs font-bold ${selectedStudy.grade === 'STRONG' ? 'text-teal-600' : 'text-amber-600'}`}>{selectedStudy.grade}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Risk of Bias</p>
                              <p className="text-xs font-bold text-gray-700">{selectedStudy.riskOfBias}</p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                              <h5 className="text-[9px] font-bold text-[#009688] uppercase tracking-widest mb-2">Population</h5>
                              <p className="text-sm text-gray-700 font-medium leading-relaxed">{selectedStudy.population}</p>
                            </div>
                            <div className="bg-blue-50/20 p-4 rounded-xl border border-blue-50">
                              <h5 className="text-[9px] font-bold text-[#004d73] uppercase tracking-widest mb-2">Intervention</h5>
                              <p className="text-sm text-gray-800 font-semibold leading-relaxed">{selectedStudy.intervention}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {state.detailTab === 'abstract' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                           <h5 className="text-[10px] font-bold text-[#004d73] uppercase tracking-widest mb-4 border-b pb-2">PubMed Abstract</h5>
                           <p className="text-sm text-gray-600 leading-relaxed italic border-l-4 border-teal-100 pl-4 py-2 bg-gray-50/30 rounded-r-xl">"...{selectedStudy.abstractSnippet}..."</p>
                        </div>
                      )}

                      {state.detailTab === 'outcomes' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                          <h5 className="text-[10px] font-bold text-[#004d73] uppercase tracking-widest mb-4 border-b pb-2">Primary Outcomes</h5>
                          <div className="bg-white border-2 border-teal-50 p-4 rounded-xl shadow-sm">
                            <p className="text-sm text-gray-900 font-bold mb-2">Clinical Results</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{selectedStudy.outcome}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-8 pt-6 border-t space-y-3">
                        <a href={selectedStudy.url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3 bg-[#004d73] text-white rounded-xl font-bold text-xs shadow-md">View PubMed Record <Icons.ChevronRight /></a>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 mb-4 border border-gray-100"><Icons.Matrix /></div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">No Selection</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">Select a study from the evidence matrix to inspect clinical details, outcomes, and risk of bias.</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default App;
