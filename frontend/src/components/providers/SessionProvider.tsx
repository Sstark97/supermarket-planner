"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useCartSessionSync } from "@/hooks/useCartSessionSync";

interface SessionProviderProps {
  children: React.ReactNode;
}

function CartSessionSync(): null {
  useCartSessionSync();
  return null;
}

export function SessionProvider({ children }: SessionProviderProps): React.ReactElement {
  return (
    <NextAuthSessionProvider>
      <CartSessionSync />
      {children}
    </NextAuthSessionProvider>
  );
}
