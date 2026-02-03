import { Router, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { requireAuth, type AuthRequest } from '../auth.js';

const router: IRouter = Router();

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.json({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      sponsorId: req.user.sponsorId,
      publisherId: req.user.publisherId,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

router.get('/role/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    // Check if user is a sponsor
    const sponsor = await prisma.sponsor.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (sponsor) {
      res.json({ role: 'sponsor', sponsorId: sponsor.id, name: sponsor.name });
      return;
    }

    // Check if user is a publisher
    const publisher = await prisma.publisher.findUnique({
      where: { userId },
      select: { id: true, name: true },
    });

    if (publisher) {
      res.json({ role: 'publisher', publisherId: publisher.id, name: publisher.name });
      return;
    }

    // User has no role assigned
    res.json({ role: null });
  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ error: 'Failed to fetch user role' });
  }
});

export default router;
