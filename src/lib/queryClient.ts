import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      gcTime: 30 * 60 * 1000, // 30分（旧cacheTime）
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
