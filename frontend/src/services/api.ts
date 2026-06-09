// frontend/src/services/api.ts

// 🚀 MENGGUNAKAN SERVER RENDER (PRODUCTION) SEBAGAI DEFAULT
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://siprus-api.onrender.com/api';

const getCleanToken = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return token.replace(/^['"]+|['"]+$/g, '');
};

const getHeaders = (customHeaders?: HeadersInit): HeadersInit => {
  const token = getCleanToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...customHeaders,
  };
};

const prepareBody = (body: any) => {
  if (!body) return undefined;
  if (typeof body === 'string') {
    if (body.startsWith('"') && body.endsWith('"')) {
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed === 'string') return parsed; 
      } catch(e) {}
    }
    return body; 
  }
  return JSON.stringify(body);
};

const handleResponse = async (response: Response, endpoint: string) => {
  if (response.status === 401) {
    console.warn("API: Sesi tidak sah atau kadaluarsa (401). Silakan login ulang.");
  }

  const text = await response.text();
  let data: any = {};
  
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { message: text };
  }
  
  if (!response.ok) {
    const errorMsg = data.error || data.message || `Terjadi kesalahan pada server (Status: ${response.status})`;
    console.error(`❌ [API Error] ${endpoint} (${response.status}):`, errorMsg, data);
    throw new Error(errorMsg);
  }
  
  return data;
};

const getFullUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BASE_URL}${cleanEndpoint}`;
};

export const api = {
  get: async (endpoint: string, customHeaders?: HeadersInit) => {
    const response = await fetch(getFullUrl(endpoint), {
      method: 'GET',
      headers: getHeaders(customHeaders),
    });
    return handleResponse(response, endpoint);
  },
  
  post: async (endpoint: string, body?: any, customHeaders?: HeadersInit) => {
    const response = await fetch(getFullUrl(endpoint), {
      method: 'POST',
      headers: getHeaders(customHeaders),
      body: prepareBody(body),
    });
    return handleResponse(response, endpoint);
  },
  
  put: async (endpoint: string, body?: any, customHeaders?: HeadersInit) => {
    const response = await fetch(getFullUrl(endpoint), {
      method: 'PUT',
      headers: getHeaders(customHeaders),
      body: prepareBody(body),
    });
    return handleResponse(response, endpoint);
  },
  
  delete: async (endpoint: string, customHeaders?: HeadersInit) => {
    const response = await fetch(getFullUrl(endpoint), {
      method: 'DELETE',
      headers: getHeaders(customHeaders),
    });
    return handleResponse(response, endpoint);
  },
  
  patch: async (endpoint: string, body?: any, customHeaders?: HeadersInit) => {
    const response = await fetch(getFullUrl(endpoint), {
      method: 'PATCH',
      headers: getHeaders(customHeaders),
      body: prepareBody(body),
    });
    return handleResponse(response, endpoint);
  }
};

export async function apiRequest<T = any>(
  endpoint: string,
  options?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: any; headers?: HeadersInit }
): Promise<T> {
  const method = options?.method || 'GET';
  const body = options?.body;
  const headers = options?.headers;

  switch (method) {
    case 'GET': return api.get(endpoint, headers) as Promise<T>;
    case 'POST': return api.post(endpoint, body, headers) as Promise<T>;
    case 'PUT': return api.put(endpoint, body, headers) as Promise<T>;
    case 'PATCH': return api.patch(endpoint, body, headers) as Promise<T>;
    case 'DELETE': return api.delete(endpoint, headers) as Promise<T>;
    default: throw new Error(`Method ${method} tidak didukung`);
  }
}

export default api;