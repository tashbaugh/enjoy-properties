import type { NextRequest } from 'next/server';
import { timingSafeStringEqual } from '@/lib/timing-safe-equal';

export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed
  return timingSafeStringEqual(request.headers.get('authorization') ?? '', `Bearer ${secret}`);
}
