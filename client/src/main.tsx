import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Configure QueryClient with retry logic and error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed queries up to 3 times
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
          return false;
        }
        // Don't retry on client errors (4xx)
        if (error instanceof TRPCClientError && error.data?.httpStatus && error.data.httpStatus >= 400 && error.data.httpStatus < 500) {
          return false;
        }
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      // Exponential backoff: 1s, 2s, 4s
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: false,
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      // Retry mutations once for network errors only
      retry: (failureCount, error) => {
        // Never retry auth errors or client errors
        if (error instanceof TRPCClientError) {
          if (error.message === UNAUTHED_ERR_MSG) return false;
          if (error.data?.httpStatus && error.data.httpStatus >= 400 && error.data.httpStatus < 500) {
            return false;
          }
        }
        // Retry once for network/server errors
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // DEV-only: Never redirect if demo session is present or in grace/role switch window
  // This prevents flicker during demo account switching
  if (import.meta.env.DEV) {
    try {
      const demoSessionPresent = localStorage.getItem('demo_session_present') === '1';
      const graceWindowEnd = localStorage.getItem('demo_grace_window_end');
      const roleSwitchEnd = localStorage.getItem('demo_role_switch_end');
      
      const inGraceWindow = graceWindowEnd ? Date.now() < parseInt(graceWindowEnd, 10) : false;
      const inRoleSwitch = roleSwitchEnd ? Date.now() < parseInt(roleSwitchEnd, 10) : false;
      
      if (demoSessionPresent || inGraceWindow || inRoleSwitch) {
        if (import.meta.env.DEV) {
          console.log("[Auth] DEV: Blocking redirect - demo session/grace/role switch active");
        }
        return; // Do not redirect in DEV demo mode
      }
    } catch (e) {
      // localStorage not available
    }
  }

  // Check if user is using demo authentication (stored in localStorage)
  const demoUser = localStorage.getItem('magsasa_user');
  if (demoUser) {
    // User is logged in with demo account, redirect to /login instead of OAuth
    window.location.href = '/login';
    return;
  }

  // Otherwise use OAuth login
  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Create tRPC client with enhanced configuration
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      // Custom fetch with credentials and timeout
      fetch(input, init) {
        // Create an AbortController for request timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include", // Include cookies for authentication
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
      // Batch requests within 10ms window
      maxURLLength: 2083,
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* React Query DevTools - only shows in development */}
      <ReactQueryDevtools initialIsOpen={false} position={"bottom-right" as any} />
    </QueryClientProvider>
  </trpc.Provider>
);
