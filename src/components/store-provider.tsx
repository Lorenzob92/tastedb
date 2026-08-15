"use client";

import { StoreProvider } from "@/lib/store";

export function ClientStoreProvider({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
}
