import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
//import { Notification } from '../modules/model';

dotenv.config();

interface ZoneDetails {
  type: string;
  currentRisk: string;
  status: 'entering' | 'exiting';
  userContext?: {
    userId?: string; // Added userId field
    name?: string;
    preferences?: string[];
  };
  activity?: 'pedestrian' | 'car';
}

export const generateZoneNotification = async (req: Request, res: Response) => {
  try {
    const { type, currentRisk, status, userContext, activity } = req.body as ZoneDetails;

    if (!type || currentRisk === undefined || !status) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const prompt = `Create a concise safety notification (strictly 15 words max) for a user ${status}:
    - Zone type: ${type} (Risk: ${currentRisk})
    - User: ${userContext?.name || "Anonymous"}
    - Preferences: ${userContext?.preferences?.join(", ") || "None"}
    - Activity: ${activity || "pedestrian"}
    
    Format: [User-focused alert] + [Specific safety action]. Use casual tone with optional emoji.`;

    const response:any = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 30,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
      }
    );

    const notificationContent = response.data.choices[0]?.message?.content?.trim() || '';

    // Create and save notification to database
    // const newNotification = new Notification({
    //   title: `${type.toUpperCase()} ZONE ALERT`,
    //   message: notificationContent,
    //   type: type,
    //   date: new Date(),
    //   seen: false,
    //   user_id: userContext?.userId || 'system-generated', // Use userId from context
    // });

    // await newNotification.save();

    // res.status(200).json({ 
    //   notification: notificationContent,
    //   dbId: newNotification._id 
    // });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to process notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};