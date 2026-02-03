import { Router, type Response, type IRouter } from 'express';
import { prisma } from '../db.js';
import { getParam } from '../utils/helpers.js';
import { requireAuth, requireRole, type AuthRequest } from '../auth.js';

const router: IRouter = Router();

router.get('/', requireAuth, requireRole(['sponsor']), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    if (!req.user?.sponsorId) {
      res.status(403).json({ error: 'Forbidden - Not a sponsor' });
      return;
    }

    const campaigns = await prisma.campaign.findMany({
      where: {
        sponsorId: req.user.sponsorId,
        ...(status && { status: status as string as 'ACTIVE' | 'PAUSED' | 'COMPLETED' }),
      },
      include: {
        sponsor: { select: { id: true, name: true, logo: true } },
        _count: { select: { creatives: true, placements: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(campaigns);
  } catch {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        sponsor: true,
        creatives: true,
        placements: {
          include: {
            adSlot: true,
            publisher: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (req.user?.role === 'sponsor' && campaign.sponsorId !== req.user.sponsorId) {
      res.status(403).json({ error: 'Forbidden - Cannot access another sponsor\'s campaign' });
      return;
    }

    res.json(campaign);
  } catch {
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

router.post('/', requireAuth, requireRole(['sponsor']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      budget,
      cpmRate,
      cpcRate,
      startDate,
      endDate,
      targetCategories,
      targetRegions,
    } = req.body;

    if (!name || !budget || !startDate || !endDate) {
      res.status(400).json({
        error: 'Name, budget, startDate, and endDate are required',
      });
      return;
    }

    if (!req.user?.sponsorId) {
      res.status(403).json({ error: 'Forbidden - Not a sponsor' });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        budget,
        cpmRate,
        cpcRate,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        targetCategories: targetCategories || [],
        targetRegions: targetRegions || [],
        sponsorId: req.user.sponsorId,
      },
      include: {
        sponsor: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(campaign);
  } catch {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.put('/:id', requireAuth, requireRole(['sponsor']), async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);
    const {
      name,
      description,
      budget,
      cpmRate,
      cpcRate,
      startDate,
      endDate,
      targetCategories,
      targetRegions,
      status,
    } = req.body;

    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      select: { sponsorId: true },
    });

    if (!existingCampaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (existingCampaign.sponsorId !== req.user?.sponsorId) {
      res.status(403).json({ error: 'Forbidden - Cannot update another sponsor\'s campaign' });
      return;
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(budget !== undefined && { budget }),
        ...(cpmRate !== undefined && { cpmRate }),
        ...(cpcRate !== undefined && { cpcRate }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(targetCategories !== undefined && { targetCategories }),
        ...(targetRegions !== undefined && { targetRegions }),
        ...(status !== undefined && { status }),
      },
      include: {
        sponsor: { select: { id: true, name: true } },
      },
    });

    res.json(campaign);
  } catch {
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

router.delete('/:id', requireAuth, requireRole(['sponsor']), async (req: AuthRequest, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      select: { sponsorId: true },
    });

    if (!existingCampaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (existingCampaign.sponsorId !== req.user?.sponsorId) {
      res.status(403).json({ error: 'Forbidden - Cannot delete another sponsor\'s campaign' });
      return;
    }

    await prisma.campaign.delete({ where: { id } });

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;
