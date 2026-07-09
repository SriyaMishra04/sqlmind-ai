import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const importCSVFile = async (file: File, batchSize: number = 50) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('batchSize', batchSize.toString());

  const response = await axios.post(`${API_BASE_URL}/csv/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
