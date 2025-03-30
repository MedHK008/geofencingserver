import { Request, Response } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config(); 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ZoneDetails {
  type: string;
  currentRisk: number;
  status: 'entering' | 'exiting';
  userContext?: {
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

    const prompt = `Generate a short, friendly notification (max 15 words) for a user ${
      status === 'entering' ? 'entering' : 'exiting'
    } a ${type} zone with risk level ${currentRisk}. User context: ${
      userContext?.name ? `Name: ${userContext.name}` : 'none'
    } Preferences: ${userContext?.preferences?.join(', ') || 'none'}
    Activity: ${activity || 'pedestrian'}. Include relevant safety advice.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 30,
      temperature: 0.7,
    });

    res.status(200).json({ 
      notification: response.choices[0]?.message?.content?.trim() || 'Notification not generated' 
    });
  } catch (error) {
    console.error('AI notification failed:', error);
    res.status(500).json({ error: 'Failed to generate notification' });
  }
};