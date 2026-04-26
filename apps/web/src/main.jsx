import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // retry once on transient network failures
      retry: 1,
      staleTime: 10_000,
      // refetch when user returns to tab after a network blip
      refetchOnWindowFocus: true,
    },
    mutations: {
      // safe to retry POST because every request carries an Idempotency-Key
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
