import express, { Request, Response } from 'express';
import { generateZoneNotification } from '../controllers/zoneNotificationsController';

const router = express.Router();

router.post('/zone-notification', async (req: Request, res: Response) => {
  try {
	await generateZoneNotification(req, res);
  } catch (error) {
	res.status(500).send(error);
  }
});

export default router;
