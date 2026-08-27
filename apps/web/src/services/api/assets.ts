import { fetchApi } from './client.js';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000';

export const assetsApi = {
  async getMedia(): Promise<any[]> {
    try {
      return await fetchApi<any[]>('/api/assets');
    } catch {
      return [];
    }
  },

  async uploadAsset(file: File): Promise<{ id: string; url: string; originalName: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE_URL}/api/assets`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const json = await res.json();
      const result = json.data || json;
      return {
        id: String(result.id || Date.now()),
        url: result.url || result.public_url || '',
        originalName: file.name
      };
    } catch {
      // Data URL fallback for local offline resilience
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: `asset-${Date.now()}`,
            url: reader.result as string,
            originalName: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    }
  },

  async uploadImage(file: File): Promise<{ id: string; url: string; originalName: string }> {
    return this.uploadAsset(file);
  },

  async deleteMedia(id: string): Promise<void> {
    return fetchApi<void>(`/api/assets/${id}`, { method: 'DELETE' });
  }
};
