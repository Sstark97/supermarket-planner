"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps): React.ReactElement {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
