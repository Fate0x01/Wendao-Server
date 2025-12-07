import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import api from 'services';
import { useAuthStore } from 'stores/auth';
import proxy from '../configs/host';

const env = import.meta.env.MODE || 'development';
const API_HOST = (proxy[env as keyof typeof proxy] as { API: string }).API;

const SUCCESS_CODE = 0;
const TIMEOUT = 10000;

export interface ApiResponse<T> {
  code: number;
  msg?: string;
  data: T;
}

interface RetryAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export const instance = axios.create({
  baseURL: API_HOST,
  timeout: TIMEOUT,
  withCredentials: true,
});

// 在请求阶段追加鉴权头
instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

// 执行刷新令牌，避免并发重复刷新
const doRefreshToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken: currentRefreshToken, actions } = useAuthStore.getState();
      if (!currentRefreshToken) return null;
      try {
        // 使用 orval 生成的 API
        const res = await api.sysAuthControllerRefresh({ refresh_token: currentRefreshToken });
        if (res.code !== SUCCESS_CODE) throw res;
        actions.setTokens(res.data!);
        return res.data!.access_token;
      } catch (error) {
        actions.reset();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

instance.interceptors.response.use(
  (response) => {
    const { data } = response;
    // 如果是 Blob 响应（文件下载），直接返回 Blob，不进行 code 检查
    if (data instanceof Blob) {
      return data;
    }
    // 普通 JSON 响应，检查 code
    if (data.code === SUCCESS_CODE) {
      return data;
    }
    return Promise.reject(data);
  },
  async (error: AxiosError) => {
    const originalConfig = error.config as RetryAxiosRequestConfig;
    const status = error.response?.status;

    // 401 时尝试刷新令牌后重试一次
    if (status === 401 && !originalConfig?._retry) {
      originalConfig._retry = true;
      const newToken = await doRefreshToken();
      if (newToken) {
        originalConfig.headers = {
          ...(originalConfig.headers || {}),
          Authorization: `Bearer ${newToken}`,
        };
        return instance(originalConfig);
      }
    }

    return Promise.reject(error.response?.data || error);
  },
);

export default instance;
