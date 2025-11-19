import { NextResponse } from 'next/server';
import { db } from '@/configs/db';
import { CourseList } from '@/schema/schema';
import { eq } from 'drizzle-orm';
import { getAuth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    // Prefer server-authenticated user
    // @ts-ignore - adapt to Clerk getAuth typing in this environment
    const { userId } = getAuth(req as any);

    let email: string | undefined;

    if (userId) {
      try {
        // clerkClient singleton is deprecated; use clerkClient() in newer versions
        const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
        const user = await client.users.getUser(userId);
        // Attempt to read primary email from Clerk user object
        // Different Clerk versions expose email fields differently; check common shapes
        // Try primaryEmailAddress first, then emailAddresses array
        // @ts-ignore
        email = user.primaryEmailAddress?.emailAddress ??
          // @ts-ignore
          user.emailAddresses?.[0]?.emailAddress ??
          // fallback to legacy property
          // @ts-ignore
          user.email;
      } catch (e) {
        console.error('Failed to fetch user from Clerk:', e);
      }
    }

    // If we don't have an authenticated email, allow client-supplied email as fallback
    if (!email) {
      const body = await req.json().catch(() => ({}));
      email = body?.email;
    }

    if (!email) {
      console.error('No email available for /api/courses request. Auth userId:', userId);
      return NextResponse.json({ error: 'Missing email or unauthenticated' }, { status: 400 });
    }

    // Run DB query on server with improved DB error handling
    try {
      const res = await db.select().from(CourseList).where(eq(CourseList.createdBy, email));
      return NextResponse.json({ data: res });
    } catch (dbErr: any) {
      console.error('/api/courses db error:', dbErr);
      // Handle common network/connectivity errors to give actionable guidance
      const causeCode = dbErr?.sourceError?.cause?.code ?? dbErr?.cause?.code;
      const msg = dbErr?.message ?? String(dbErr);
      if (String(msg).includes('Connect Timeout') || causeCode === 'UND_ERR_CONNECT_TIMEOUT') {
        return NextResponse.json({
          error: 'Database connection timeout. Check your network, firewall, VPN, and that `DRIZZLE_DATABASE_URL` is correct. Try: `Test-NetConnection api.c-2.us-east-1.aws.neon.tech -Port 443` on PowerShell.'
        }, { status: 503 });
      }

      return NextResponse.json({ error: 'Database error. See server logs for details.' }, { status: 500 });
    }
  } catch (err: any) {
    // Log full error on server for debugging
    console.error('/api/courses error:', err);
    // If error is a Clerk fetch failure, give a hint about Clerk/network
    const isClerkFetch = err?.errors?.[0]?.message?.toString().toLowerCase().includes('fetch') || String(err).toLowerCase().includes('clerk');
    if (isClerkFetch) {
      return NextResponse.json({ error: 'Auth provider fetch failed. Check Clerk credentials, network access, and that Clerk service is reachable from this environment.' }, { status: 502 });
    }

    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
