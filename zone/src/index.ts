import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose, { Document, Schema } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI as string;

const app = express();    
const PORT_ZONES: number = parseInt(process.env.PORT_ZONES as string, 10);

interface Zone extends Document {
  id: string;
  lat: number;
  lon: number;
  name?: string; // Optional since it’s not always present
  tags: {
    landuse?: string;
    leisure?: string;
    natural?: string;
  };
  geometry?: Array<{ lat: number; lon: number }>; // Add geometry
}

const zoneSchema = new Schema<Zone>({
  id: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  name: { type: String, required: false },
  tags: {
    landuse: { type: String, required: false },
    leisure: { type: String, required: false },
    natural: { type: String, required: false }
  },
  geometry: [{
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  }]
}, { collection: 'zone' });

interface ProcessedZone {
  id: string;
  type: string;
  lat: number;
  lon: number;
  name?: string;
  geometry?: Array<{ lat: number; lon: number }>; // Add geometry to response
}

const ZoneModel = mongoose.model<Zone>('zone', zoneSchema);

app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');

mongoose.set('strictQuery', true);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    app.get('/api/zones', async (req: Request, res: Response) => {
      try {
        const zones = await ZoneModel.find().exec();

        const processedZones: ProcessedZone[] = zones.map((zone: Zone): ProcessedZone => {
          return {
            id: zone.id,
            type: zone.tags.landuse || zone.tags.leisure || zone.tags.natural || 'unknown',
            lat: zone.lat,
            lon: zone.lon,
            name: zone.name,
            geometry: zone.geometry // Include geometry in the response
          };
        });

        res.json(processedZones);
      } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
      }
    });

    app.listen(PORT_ZONES, () => {
      console.log(`Server is running at http://localhost:${PORT_ZONES}/api/zones`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });