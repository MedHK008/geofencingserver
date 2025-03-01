import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose, { Document, Schema } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI as string;

const app = express();
const PORT_BUILDINGS: number = parseInt(process.env.PORT_BUILDINGS as string, 10);

interface Building extends Document {
  id: number;
  type: string;
  lat: number;
  lon: number;
  name: string;
}

const buildingSchema = new Schema<Building>({
  id: { type: Number, required: true },
  type: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  name: { type: String, required: true }
},{ collection: 'building' });

interface ProcessedBuilding {
    id: number;
    type: string;
    lat: number;
    lon: number;
    name: string;
  }

const BuildingModel = mongoose.model<Building>('building', buildingSchema);

app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');

mongoose.set('strictQuery', true); // Add this line to suppress the deprecation warning

// console.log('MONGO_URI:', MONGO_URI);

// console.log('PORT_BUILDINGS:', PORT_BUILDINGS);

// console.log(BuildingModel);

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    // console.log('Connected to MongoDB'); // Add a log to confirm connection

    app.get('/api/buildings', async (req: Request, res: Response) => {
      try {
        const buildings = await BuildingModel.find().exec();

        if (buildings.length === 0) {
          console.log('No buildings found in the database.');
        }

        const processedBuildings: ProcessedBuilding[] = buildings.map((building: Building): ProcessedBuilding => ({
          id: building.id,
          type: building.type,
          lat: building.lat,
          lon: building.lon,
          name: building.name
        }));
        res.json(processedBuildings);
      } catch (error) {
        console.error('Error fetching buildings:', error);
        res.status(500).json({ error: 'Failed to fetch buildings' });
      }
    });

    // Root route
    app.get('/', (req: Request, res: Response) => {
      res.render('index');
    });

    // Start the server
    app.listen(PORT_BUILDINGS, () => {
      console.log(`API is running on http://localhost:${PORT_BUILDINGS}/api/buildings`);
    });
  })
  .catch((err: string) => {
    console.error('Failed to connect to MongoDB', err);
  });