
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import EvidenceMatrix from './components/EvidenceMatrix';
import { Icons, COLORS } from './constants';
import { AppState, SearchResult, Study } from './types';
import { performEvidenceSearch, getSearchSuggestions } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isLoading: false,
    activeTab: 'summary',
    history: ['Effect of Metformin on longevity', 'GLP-1 agonists side effects'],
    isSidebarOpen: true
  });
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setState(prev => ({ ...prev, isLoading: true }));
    setIsSearching(true);

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
    } finally {
      setIsSearching(false);
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

  const selectedStudy = state.currentSearch?.evidenceMatrix.find(s => s.id === state.selectedStudyId);

  // Chart Data Simulation based on matrix
  const getTrendData = () => {
    if (!state.currentSearch) return [];
    const counts: Record<number, number> = {};
    state.currentSearch.evidenceMatrix.forEach(s => {
      counts[s.year] = (counts[s.year] || 0) + 1;
    });
    return Object.keys(counts).map(year => ({ year, count: counts[parseInt(year)] })).sort((a,b) => parseInt(a.year) - parseInt(b.year));
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <Sidebar isOpen={state.isSidebarOpen} onToggle={() => setState(p => ({...p, isSidebarOpen: !p.isSidebarOpen}))} />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Search Bar */}
        <header className="h-16 flex items-center px-8 border-b bg-white gap-4">
          <button onClick={() => setState(p => ({...p, isSidebarOpen: !p.isSidebarOpen}))} className="lg:hidden">
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
              placeholder="Search medical evidence (e.g., 'Efficacy of SGLT2i in heart failure')..."
              className="w-full pl-12 pr-4 py-2.5 rounded-2xl bg-gray-100 border-none focus:ring-2 focus:ring-[#009688] outline-none transition-all text-sm font-medium"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => { handleSearch(s); setSuggestions([]); }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 flex items-center gap-3 transition-colors border-b last:border-b-0"
                  >
                    <Icons.TrendingUp />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2 text-gray-400 hover:text-[#004d73] transition-colors"><Icons.Alert /></button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#009688] text-white rounded-xl font-semibold text-sm hover:bg-[#00796b] transition-all shadow-md active:scale-95">
              <span>Pro Search</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Feed */}
          <section className="flex-1 flex flex-col overflow-y-auto p-8 custom-scrollbar">
            {!state.currentSearch && !state.isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-[#009688] mb-6 shadow-sm border border-blue-100">
                  <Icons.Search />
                </div>
                <h2 className="text-2xl font-bold text-[#004d73] mb-2">Evidence-First Medical Search</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">Search across millions of peer-reviewed articles. Our AI synthesizes findings into an interactive evidence matrix with confidence scoring.</p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {state.history.map((h, i) => (
                    <button key={i} onClick={() => handleSearch(h)} className="p-3 bg-white border border-gray-100 rounded-xl text-xs font-medium text-gray-600 hover:border-[#009688] hover:text-[#009688] transition-all text-left truncate">
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {state.isLoading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#009688] animate-[loading_1.5s_infinite]" style={{ width: '40%' }}></div>
                </div>
                <p className="text-sm font-medium text-gray-500 animate-pulse">Querying PubMed & synthesizing evidence...</p>
                <style>{`
                  @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                  }
                `}</style>
              </div>
            )}

            {state.currentSearch && !state.isLoading && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Answer Summary Card */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:scale-110" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-teal-100 text-[#009688] text-[10px] font-bold uppercase tracking-widest rounded-full">Synthesized Answer</span>
                      <span className="text-xs text-gray-400 font-mono">Sources: {state.currentSearch.evidenceMatrix.length} studies</span>
                    </div>
                    <h2 className="text-xl font-bold text-[#004d73] mb-4 leading-snug">{state.currentSearch.query}</h2>
                    <p className="text-gray-700 leading-relaxed mb-6 text-[15px]">{state.currentSearch.summary}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {state.currentSearch.keyTakeaways.map((takeaway, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition-colors">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center mt-0.5">
                            <Icons.Check />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Matrix Section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-[#004d73]">Evidence Matrix</h3>
                      <p className="text-xs text-gray-500">Compare population, intervention, and outcomes across top studies</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"><Icons.FileText /></button>
                      <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"><Icons.Share /></button>
                    </div>
                  </div>
                  
                  <EvidenceMatrix 
                    studies={state.currentSearch.evidenceMatrix} 
                    onSelectStudy={(id) => setState(p => ({...p, selectedStudyId: id}))} 
                  />
                </div>

                {/* Advanced Insights Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-md font-bold text-[#004d73] mb-4 flex items-center gap-2">
                      <Icons.TrendingUp /> Evidence Trends
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getTrendData()}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                          <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                          />
                          <Bar dataKey="count" fill="#009688" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#004d73] text-white rounded-2xl p-6 shadow-lg shadow-blue-900/20">
                    <h3 className="text-md font-bold mb-4">Outcome Distribution</h3>
                    <div className="space-y-4">
                      {state.currentSearch.outcomes.map((oc, i) => (
                        <div key={i} className="p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/15 transition-colors cursor-default">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-teal-300 uppercase tracking-wide">{oc.category}</span>
                            <span className="text-[10px] text-white/60">{oc.studies.length} studies</span>
                          </div>
                          <p className="text-sm text-blue-50 leading-relaxed">{oc.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Limitations */}
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
                   <h3 className="text-md font-bold text-amber-900 mb-3 flex items-center gap-2">
                      <Icons.Alert /> Critical Limitations
                   </h3>
                   <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                     {state.currentSearch.limitations.map((lim, i) => (
                       <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                         <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                         {lim}
                       </li>
                     ))}
                   </ul>
                </div>
              </div>
            )}
          </section>

          {/* Right Detail Panel */}
          <aside className={`w-96 border-l bg-white flex flex-col transition-all duration-300 ${state.selectedStudyId ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 absolute right-0'}`}>
            {selectedStudy && (
              <div className="flex flex-col h-full overflow-hidden">
                <header className="p-6 border-b flex items-center justify-between">
                   <h3 className="font-bold text-[#004d73]">Study Details</h3>
                   <button onClick={() => setState(p => ({...p, selectedStudyId: undefined}))} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                     <Icons.ChevronRight />
                   </button>
                </header>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div>
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase mb-2 inline-block">
                      {selectedStudy.type}
                    </span>
                    <h4 className="text-lg font-bold leading-snug mb-2">{selectedStudy.title}</h4>
                    <p className="text-sm text-gray-500">{selectedStudy.authors} — <span className="italic">{selectedStudy.journal} ({selectedStudy.year})</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Evidence Grade</p>
                      <p className={`text-sm font-bold ${selectedStudy.grade === 'STRONG' ? 'text-teal-600' : 'text-amber-600'}`}>{selectedStudy.grade}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Risk of Bias</p>
                      <p className="text-sm font-bold text-gray-700">{selectedStudy.riskOfBias}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-[#004d73] uppercase tracking-wider mb-2">Patient Population</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedStudy.population}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#004d73] uppercase tracking-wider mb-2">Intervention</h5>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedStudy.intervention}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-[#004d73] uppercase tracking-wider mb-2">Abstract Snippet</h5>
                      <p className="text-sm text-gray-600 italic leading-relaxed">"...{selectedStudy.abstractSnippet}..."</p>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t flex flex-col gap-3">
                    <a 
                      href={selectedStudy.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#004d73] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
                    >
                      View on PubMed <Icons.ChevronRight />
                    </a>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-100 text-[#004d73] rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                      <Icons.Bookmark /> Save to Project
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                      <Icons.Share /> Copy Citation (AMA)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <button 
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-[#009688] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
        onClick={() => setQuery('')}
      >
        <Icons.Search />
      </button>
    </div>
  );
};

export default App;
