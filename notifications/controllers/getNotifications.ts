import { Request, Response } from 'express';
import { Notification } from '../modules/model';



export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;

    const notifications = await Notification.find({ user_id: userId });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching notifications' });
  }
};
