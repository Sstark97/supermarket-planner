"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export function LoginButton(): React.ReactElement {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (isLoading) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "Usuario"}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <button
          onClick={() => signOut()}
          className="text-sm text-slate-600 hover:text-slate-900 transition-colors hidden lg:block"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors"
    >
      Iniciar sesión
    </button>
  );
}
