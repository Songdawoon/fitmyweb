"use client";

import { SessionProvider } from "next-auth/react";

/** next-auth 의 SessionProvider 는 클라이언트 전용이라 얇게 감싸 layout 에서 쓴다. */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
