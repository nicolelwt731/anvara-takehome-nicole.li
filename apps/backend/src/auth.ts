import { type Request, type Response, type NextFunction } from 'express';
import { betterAuth } from 'better-auth';
import { prisma } from './db.js';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

export const auth = betterAuth({
  database: new Pool({ connectionString }),
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-for-dev',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3847',
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  plugins: [],
  advanced: {
    disableCSRFCheck: true,
  },
});

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'sponsor' | 'publisher';
    sponsorId?: string;
    publisherId?: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value[0] : value);
      }
    });
    
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      res.status(401).json({ error: 'Unauthorized - Please log in' });
      return;
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (sponsor) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: 'sponsor',
        sponsorId: sponsor.id,
      };
      next();
      return;
    }

    const publisher = await prisma.publisher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (publisher) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        role: 'publisher',
        publisherId: publisher.id,
      };
      next();
      return;
    }

    res.status(403).json({ error: 'Forbidden - No role assigned' });
  } catch {
    res.status(401).json({ error: 'Unauthorized - Invalid session' });
  }
}

export function requireRole(allowedRoles: Array<'sponsor' | 'publisher'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      return;
    }
    next();
  };
}
