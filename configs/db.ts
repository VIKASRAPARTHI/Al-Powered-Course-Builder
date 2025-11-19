import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { BaseEnvironment } from "./BaseEnvironment";

const env = new BaseEnvironment();

// Prefer a server-only `DRIZZLE_DATABASE_URL`, fall back to NEXT_PUBLIC if present
const drizzleUrl = process.env.DRIZZLE_DATABASE_URL || process.env.NEXT_PUBLIC_DRIZZLE_DATABASE_URL || env.DRIZZLE_DATABASE_URL;
if (!drizzleUrl) {
	throw new Error(
		"Missing DRIZZLE_DATABASE_URL. Set DRIZZLE_DATABASE_URL (server-only) or NEXT_PUBLIC_DRIZZLE_DATABASE_URL in your environment (e.g. in .env or .env.local)."
	);
}

const looksLikeValidDbUrl = (u: string) => {
	// Basic checks: should contain a postgres scheme or be a Neon URL
	if (!u || typeof u !== "string") return false;
	const lowered = u.toLowerCase();
	return (
		lowered.startsWith("postgres://") ||
		lowered.startsWith("postgresql://") ||
		lowered.includes("neon.tech") ||
		lowered.includes("@")
	);
};

if (!looksLikeValidDbUrl(drizzleUrl)) {
	throw new Error(
		`Invalid database connection string provided to neon(): "${drizzleUrl}"\n\n` +
			"Please set a valid PostgreSQL connection string in your environment.\n" +
			"Add it to `.env.local` at your project root, for example:\n\n" +
			"NEXT_PUBLIC_DRIZZLE_DATABASE_URL=\"postgresql://user:password@host:5432/dbname?sslmode=require\"\n\n" +
			"Or set `DRIZZLE_DATABASE_URL` as an environment variable. If you're using Neon, use the full Neon connection string provided by the dashboard."
	);
}

let sqlClient = null;
try {
	// log host (masked) to help debugging without revealing credentials
	try {
		const url = new URL(drizzleUrl);
		console.log('[db] connecting to host:', url.hostname);
	} catch (e) {
		console.log('[db] using DRIZZLE_DATABASE_URL (could not parse for logging)');
	}

	sqlClient = neon(drizzleUrl);
} catch (err: any) {
	console.error('[db] neon() init error:', err?.message ?? err);
	throw err;
}

export const db = drizzle(sqlClient as any);
