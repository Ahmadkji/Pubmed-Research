
export enum EvidenceGrade {
  STRONG = 'STRONG',
  MODERATE = 'MODERATE',
  WEAK = 'WEAK',
  CONFLICTING = 'CONFLICTING'
}

export enum StudyType {
  RCT = 'RCT',
  META_ANALYSIS = 'Meta-Analysis',
  SYSTEMATIC_REVIEW = 'Systematic Review',
  OBSERVATIONAL = 'Observational',
  GUIDELINE = 'Clinical Guideline'
}

export interface Study {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  type: StudyType;
  sampleSize: number;
  population: string;
  intervention: string;
  outcome: string;
  grade: EvidenceGrade;
  pubmedId: string;
  url: string;
  abstractSnippet: string;
  riskOfBias: 'Low' | 'Moderate' | 'High';
}

export interface SearchResult {
  query: string;
  summary: string;
  keyTakeaways: string[];
  evidenceMatrix: Study[];
  outcomes: {
    category: string;
    summary: string;
    studies: string[]; // study IDs
  }[];
  limitations: string[];
  recommendations: string[];
}

export interface AppState {
  currentSearch?: SearchResult;
  isLoading: boolean;
  activeTab: 'summary' | 'matrix' | 'abstracts' | 'insights';
  selectedStudyId?: string;
  history: string[];
  isSidebarOpen: boolean;
}
