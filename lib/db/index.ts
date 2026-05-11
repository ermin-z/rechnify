import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

let _db: NeonDatabase<typeof schema> | null = null;

function getDb(): NeonDatabase<typeof schema> {
  if (!_db) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_, prop: string | symbol) {
    return Reflect.get(getDb(), prop);
  },
});
