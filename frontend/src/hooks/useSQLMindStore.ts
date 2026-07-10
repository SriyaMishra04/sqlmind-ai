import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
}

export interface TableSchema {
  columns: ColumnSchema[];
  primary_keys: string[];
  foreign_keys: { from: string; to_table: string; to_column: string }[];
  row_count: number;
}

export interface SchemaInfo {
  tables: Record<string, TableSchema>;
  relationships: { from_table: string; from_column: string; to_table: string; to_column: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sql?: string;
  summary?: string;
  explanation?: string;
  error?: string;
  data?: any[];
  columns?: string[];
  row_count?: number;
  execution_time_ms?: number;
  chart_suggestion?: any;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  db_id: string;
  question: string;
  sql: string;
  timestamp: number;
  execution_time_ms: number;
  status: 'success' | 'error';
  is_favorite: boolean;
}

export interface AppSettings {
  provider: 'gemini' | 'openai';
  model: string;
  apiKey: string;
  theme: 'dark' | 'light';
}

interface SQLMindState {
  dbId: string | null;
  filename: string | null;
  tables: string[];
  schemaInfo: SchemaInfo | null;
  suggestedQuestions: string[];
  messages: ChatMessage[];
  isUploading: boolean;
  isQuerying: boolean;
  history: HistoryItem[];
  activeQueryResult: {
    success: boolean;
    sql?: string;
    summary?: string;
    explanation?: string;
    data?: any[];
    columns?: string[];
    row_count?: number;
    execution_time_ms?: number;
    chart_suggestion?: any;
    error?: string;
  } | null;
  settings: AppSettings;
  
  // Actions
  setDbInfo: (dbId: string, filename: string, tables: string[], schemaInfo: SchemaInfo, suggestedQuestions: string[]) => void;
  resetDb: () => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  setIsUploading: (isUploading: boolean) => void;
  setIsQuerying: (isQuerying: boolean) => void;
  setHistory: (history: HistoryItem[]) => void;
  addHistoryItem: (item: HistoryItem) => void;
  toggleFavoriteHistory: (itemId: string) => void;
  deleteHistoryItem: (itemId: string) => void;
  setActiveQueryResult: (result: SQLMindState['activeQueryResult']) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

export const useSQLMindStore = create<SQLMindState>()(
  persist(
    (set) => ({
      dbId: null,
      filename: null,
      tables: [],
      schemaInfo: null,
      suggestedQuestions: [],
      messages: [],
      isUploading: false,
      isQuerying: false,
      history: [],
      activeQueryResult: null,
      settings: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        apiKey: '',
        theme: 'dark',
      },

      setDbInfo: (dbId, filename, tables, schemaInfo, suggestedQuestions) =>
        set({
          dbId,
          filename,
          tables,
          schemaInfo,
          suggestedQuestions,
          messages: [
            {
              id: 'welcome',
              role: 'assistant',
              text: `Successfully loaded database **${filename}**. I have analyzed its schema and identified ${tables.length} tables.\n\nAsk me anything about this data, or select one of the suggested prompts below to start!`,
              timestamp: Date.now(),
            },
          ],
          activeQueryResult: null,
        }),

      resetDb: () =>
        set({
          dbId: null,
          filename: null,
          tables: [],
          schemaInfo: null,
          suggestedQuestions: [],
          messages: [],
          activeQueryResult: null,
        }),

      addMessage: (msg) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...msg,
              id: Math.random().toString(36).substring(7),
              timestamp: Date.now(),
            },
          ],
        })),

      clearChat: () => set({ messages: [] }),
      setIsUploading: (isUploading) => set({ isUploading }),
      setIsQuerying: (isQuerying) => set({ isQuerying }),
      setHistory: (history) => set({ history }),
      
      addHistoryItem: (item) =>
        set((state) => ({
          history: [item, ...state.history.filter((h) => h.id !== item.id)].slice(0, 100),
        })),

      toggleFavoriteHistory: (itemId) =>
        set((state) => ({
          history: state.history.map((h) =>
            h.id === itemId ? { ...h, is_favorite: !h.is_favorite } : h
          ),
        })),

      deleteHistoryItem: (itemId) =>
        set((state) => ({
          history: state.history.filter((h) => h.id !== itemId),
        })),

      setActiveQueryResult: (activeQueryResult) => set({ activeQueryResult }),
      
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'sqlmind-storage',
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
      }),
    }
  )
);
