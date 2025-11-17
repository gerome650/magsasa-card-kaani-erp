import { createTRPCClient, httpBatchLink, splitLink, unstable_httpSubscriptionLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";
import superjson from "superjson";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      // Use subscription link for subscriptions, batch link for queries/mutations
      condition: (op) => op.type === 'subscription',
      true: unstable_httpSubscriptionLink({
        url: "/api/trpc",
        transformer: superjson,
      }),
      false: httpBatchLink({
        url: "/api/trpc",
        headers() {
          const token = localStorage.getItem("token");
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        transformer: superjson,
      }),
    }),
  ],
});
