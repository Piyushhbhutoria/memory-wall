
import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/theme-provider'
import App from './App.tsx'
import './index.css'

console.log('Main: Starting application initialization...');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

console.log('Main: QueryClient created');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Main: Root element not found!');
  throw new Error('Root element not found');
}

console.log('Main: Root element found, creating React root...');

createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="wish-wall-ui-theme">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

console.log('Main: React application rendered');
