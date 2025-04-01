import { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { Notification } from '../modules/model';

dotenv.config();

interface ZoneDetails {
  type: string;
  currentRisk: string;
  status: 'entering' | 'exiting';
  userContext: {
    user_id: string; 
    name: string;
  };
  activity?: 'pedestrian' | 'car';
}

export const generateZoneNotification = async (req: Request, res: Response) => {
  try {
    const { type, currentRisk, status, userContext, activity } = req.body as ZoneDetails;

    if (!type || currentRisk === undefined || !status) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const prompt = `Create a concise safety notification for a user ${status}:
    - Zone type: ${type} (Risk: ${currentRisk})
    - User: ${userContext?.name || ""}
    - Activity: ${activity || "pedestrian"}
    message length: 20 words .
    Format: [User-focused alert] + [Specific safety advice]. Use casual tone with optional emoji.
    Return ONLY the final notification text without quotation marks, markdown formatting, or explanatory text.
  
    `;

    const startTime = new Date().getTime();
    const response: any = await axios.post(
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
    const endTime = new Date().getTime();
    const responseTime = endTime - startTime;

    let notificationContent;

    if (responseTime > 7000) {
      notificationContent = `Be cautious, ${userContext?.name || "there"}! You're ${status} a ${type} zone with a ${currentRisk} risk.`;
    } else {
      notificationContent = response.data.choices[0]?.message?.content?.trim() || '';
    }

    // Create and save notification to database
    const newNotification = new Notification({
      title: `${type.toUpperCase()} ZONE ALERT`,
      message: notificationContent,
      date: new Date(),
      seen: false,
      user_id: userContext.user_id as string ,
    });

    await newNotification.save();

    res.status(200).json({newNotification});

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to process notification',
      details: error 
    });
  }
};
