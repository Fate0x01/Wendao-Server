import { QueryClient } from '@tanstack/react-query';

// 统一的 QueryClient 配置，控制重试和失效时间等默认行为
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
