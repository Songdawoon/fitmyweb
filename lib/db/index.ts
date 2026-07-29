import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

export * from "./schema";

/**
 * DB 연결. DATABASE_URL 이 없으면 null 을 돌려준다.
 *
 * 이 사이트는 원래 저장소 없이 메일만으로 운영됐고, 키가 없는 개발 환경에서도
 * 상담 폼과 결제가 막히지 않아야 한다(lib/email.ts 의 isEmailConfigured 와 같은
 * 방침). 그래서 호출부는 항상 `const db = getDb(); if (!db) return;` 형태로
 * DB 없이도 동작하도록 쓴다.
 */
let cached: ReturnType<typeof drizzle<typeof schema>> | null | undefined;

export function getDb() {
  if (cached !== undefined) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    cached = null;
    return cached;
  }

  cached = drizzle(neon(url), { schema });
  return cached;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
