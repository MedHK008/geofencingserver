import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose, { Document, Schema } from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI as string;


const app = express();
const PORT_TRAFFICS: number = parseInt(process.env.PORT_TRAFFICS as string, 10);

interface Traffic extends Document {
  id: string;
  type: string;
  lat: number;
  lon: number;
}

const trafficSchema = new Schema<Traffic>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true }
}, { collection: 'traffic_light' });

interface ProcessedTraffic {
  id: string;
  type: string;
  lat: number;
  lon: number;
}

const TrafficModel = mongoose.model<Traffic>('Traffic', trafficSchema);

app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');

mongoose.set('strictQuery', true); // Add this line to suppress the deprecation warning

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    app.get('/api/trafficLights', async (req: Request, res: Response) => {
      try {
        const trafficLights = await TrafficModel.find().exec();

        const processedTrafficLight = trafficLights.map((traffic_light: Traffic): ProcessedTraffic => ({
          id: traffic_light.id,
          type: traffic_light.type,
          lat: traffic_light.lat,
          lon: traffic_light.lon
        }));
        res.json(processedTrafficLight);
      } catch (error) {
        console.error('Error fetching trafficLight:', error);
        res.status(500).json({ error: 'Failed to fetch trafficLight' });
      }
    });

    app.get('/', (req: Request, res: Response) => {
      res.render('index');
    });

    // Start the server
    app.listen(PORT_TRAFFICS, () => {
      console.log(`API is running on http://localhost:${PORT_TRAFFICS}/api/trafficLights`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  });

