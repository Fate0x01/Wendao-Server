import type { AxiosRequestConfig } from 'axios';
import { instance } from 'utils/request';

// 统一使用已有的 axios 实例，复用拦截器和基础配置
export const customInstance = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig) => {
  return instance<T>({ ...config, ...options }) as Promise<T>;
};

export type { AxiosRequestConfig };
