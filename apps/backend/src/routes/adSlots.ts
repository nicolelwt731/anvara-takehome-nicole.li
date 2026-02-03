import { Router, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';
import { requireAuth, requireRole, type AuthRequest } from '../auth.js';

const router: IRouter = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { type, available } = req.query;

    const where: Record<string, unknown> = {
      ...(type && {
        type: type as string as 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'NEWSLETTER' | 'PODCAST',
      }),
      ...(available === 'true' && { isAvailable: true }),
    };

    if (req.user?.role === 'publisher') {
      where.publisherId = req.user.publisherId;
    }

    const adSlots = await prisma.adSlot.findMany({
      where,
      include: {
        publisher: { select: { id: true, name: true, category: true, monthlyViews: true } },
        _count: { select: { placements: true } },
      },
      orderBy: { basePrice: 'desc' },
    });

    res.json(adSlots);
  } catch {
    res.status(500).json({ error: 'Failed to fetch ad slots' });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      include: {
        publisher: true,
        placements: {
          include: {
            campaign: { select: { id: true, name: true, status: true } },
          },
        },
      },
    });

    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (req.user?.role === 'publisher' && adSlot.publisherId !== req.user.publisherId) {
      res.status(403).json({ error: 'Forbidden - Cannot access another publisher\'s ad slot' });
      return;
    }

    res.json(adSlot);
  } catch {
    res.status(500).json({ error: 'Failed to fetch ad slot' });
  }
});

router.post('/', requireAuth, requireRole(['publisher']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, type, basePrice, width, height, position } = req.body;

    if (!name || !type || !basePrice) {
      res.status(400).json({
        error: 'Name, type, and basePrice are required',
      });
      return;
    }

    if (basePrice <= 0) {
      res.status(400).json({ error: 'Base price must be positive' });
      return;
    }

    if (!req.user?.publisherId) {
      res.status(403).json({ error: 'Forbidden - Not a publisher' });
      return;
    }

    const adSlot = await prisma.adSlot.create({
      data: {
        name,
        description,
        type,
        basePrice,
        width,
        height,
        position,
        publisherId: req.user.publisherId,
      },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(adSlot);
  } catch {
    res.status(500).json({ error: 'Failed to create ad slot' });
  }
});

router.post('/:id/book', requireAuth, requireRole(['sponsor']), async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      include: { publisher: true },
    });

    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (!adSlot.isAvailable) {
      res.status(400).json({ error: 'Ad slot is no longer available' });
      return;
    }

    const updatedSlot = await prisma.adSlot.update({
      where: { id },
      data: { isAvailable: false },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: 'Ad slot booked successfully!',
      adSlot: updatedSlot,
    });
  } catch {
    res.status(500).json({ error: 'Failed to book ad slot' });
  }
});

router.post('/:id/unbook', requireAuth, requireRole(['publisher']), async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const adSlot = await prisma.adSlot.findUnique({
      where: { id },
      select: { publisherId: true },
    });

    if (!adSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (adSlot.publisherId !== req.user?.publisherId) {
      res.status(403).json({ error: 'Forbidden - Cannot unbook another publisher\'s ad slot' });
      return;
    }

    const updatedSlot = await prisma.adSlot.update({
      where: { id },
      data: { isAvailable: true },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      message: 'Ad slot is now available again',
      adSlot: updatedSlot,
    });
  } catch {
    res.status(500).json({ error: 'Failed to unbook ad slot' });
  }
});

router.put('/:id', requireAuth, requireRole(['publisher']), async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const { name, description, type, basePrice, width, height, position, isAvailable } = req.body;

    const existingSlot = await prisma.adSlot.findUnique({
      where: { id },
      select: { publisherId: true },
    });

    if (!existingSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (existingSlot.publisherId !== req.user?.publisherId) {
      res.status(403).json({ error: 'Forbidden - Cannot update another publisher\'s ad slot' });
      return;
    }

    if (basePrice !== undefined && basePrice <= 0) {
      res.status(400).json({ error: 'Base price must be positive' });
      return;
    }

    const adSlot = await prisma.adSlot.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(basePrice !== undefined && { basePrice }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(position !== undefined && { position }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        publisher: { select: { id: true, name: true } },
      },
    });

    res.json(adSlot);
  } catch {
    res.status(500).json({ error: 'Failed to update ad slot' });
  }
});

router.delete('/:id', requireAuth, requireRole(['publisher']), async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const existingSlot = await prisma.adSlot.findUnique({
      where: { id },
      select: { publisherId: true },
    });

    if (!existingSlot) {
      res.status(404).json({ error: 'Ad slot not found' });
      return;
    }

    if (existingSlot.publisherId !== req.user?.publisherId) {
      res.status(403).json({ error: 'Forbidden - Cannot delete another publisher\'s ad slot' });
      return;
    }

    await prisma.adSlot.delete({ where: { id } });

    res.json({ success: true, message: 'Ad slot deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete ad slot' });
  }
});

export default router;
