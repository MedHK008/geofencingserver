import express, { Request, Response } from 'express';
import { Notification } from '../modules/model';
import { getNotifications } from '../controllers/getNotifications';

const router = express.Router();

router.get('/:userId', getNotifications);

export default router;
