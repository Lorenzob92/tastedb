"use client";

import { AuthProvider } from "@/lib/auth-context";
import { StoreProvider } from "@/lib/store";

export function ClientStoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>{children}</StoreProvider>
    </AuthProvider>
  );
}
