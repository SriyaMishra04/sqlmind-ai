import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UploadApiResponse {
  db_id: string;
  filename: string;
  tables: string[];
  schema_info: any;
  suggested_questions: string[];
}

export interface QueryApiResponse {
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
}

export interface HistoryApiResponse {
  id: string;
  db_id: string;
  question: string;
  sql: string;
  timestamp: number;
  execution_time_ms: number;
  status: 'success' | 'error';
  is_favorite: boolean;
}

export const uploadFile = async (file: File): Promise<UploadApiResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const queryDatabase = async (
  dbId: string,
  prompt: string,
  provider: string,
  model: string,
  apiKey?: string
): Promise<QueryApiResponse> => {
  const response = await api.post(`/query/${dbId}`, {
    prompt,
    provider,
    model,
    api_key: apiKey || undefined,
  });
  return response.data;
};

export const executeDirectSQL = async (
  dbId: string,
  sql: string,
  prompt: string = 'Direct SQL execution'
): Promise<QueryApiResponse> => {
  const response = await api.post(`/query/${dbId}/execute`, {
    sql,
    prompt,
  });
  return response.data;
};

export const getHistory = async (dbId: string): Promise<HistoryApiResponse[]> => {
  const response = await api.get(`/history/${dbId}`);
  return response.data;
};

export const toggleFavoriteHistory = async (itemId: string): Promise<HistoryApiResponse> => {
  const response = await api.post(`/history/${itemId}/favorite`);
  return response.data;
};

export const deleteHistoryItem = async (itemId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/history/${itemId}`);
  return response.data;
};

export const clearDatabaseHistory = async (dbId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/history/clear/${dbId}`);
  return response.data;
};
