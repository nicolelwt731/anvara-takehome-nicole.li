import { Router, type IRouter } from 'express';

const router: IRouter = Router();

router.post('/subscribe', (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || typeof email !== 'string') {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    res.status(400).json({ success: false, message: 'Invalid email address' });
    return;
  }

  res.json({ success: true, message: 'Thanks for subscribing!' });
});

router.post('/unsubscribe', (req, res) => {
  const { email } = req.body as { email?: string };

  if (!email || typeof email !== 'string') {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    res.status(400).json({ success: false, message: 'Invalid email address' });
    return;
  }

  res.json({ success: true, message: 'You have been unsubscribed.' });
});

export default router;

