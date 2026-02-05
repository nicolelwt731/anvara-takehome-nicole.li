import { Router, type IRouter } from 'express';

const router: IRouter = Router();

router.post('/request', (req, res) => {
  const {
    email,
    companyName,
    adSlotId,
    adSlotName,
    phone,
    budget,
    goals,
    timeline,
    requirements,
  } = req.body as {
    email?: string;
    companyName?: string;
    adSlotId?: string;
    adSlotName?: string;
    phone?: string;
    budget?: string;
    goals?: string;
    timeline?: string;
    requirements?: string;
  };

  if (!email || typeof email !== 'string') {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  if (!companyName || typeof companyName !== 'string') {
    res.status(400).json({ success: false, message: 'Company name is required' });
    return;
  }

  if (!adSlotId || typeof adSlotId !== 'string') {
    res.status(400).json({ success: false, message: 'Ad slot is required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    res.status(400).json({ success: false, message: 'Invalid email address' });
    return;
  }

  const quoteId = Math.random().toString(36).slice(2, 10);

  res.json({
    success: true,
    quoteId,
    email,
    companyName,
    adSlotId,
    adSlotName,
    phone,
    budget,
    goals,
    timeline,
    requirements,
  });
});

export default router;

