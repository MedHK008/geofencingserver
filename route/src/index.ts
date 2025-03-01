import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose, { Document, Schema } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI as string;

const app = express();
const PORT_ROUTES: number = parseInt(process.env.PORT_ROUTES as string, 10);

mongoose.set('strictQuery', false);

interface Route extends Document {
  id: number;
  nodes: { lat: number; lon: number }[];
  tags: {
    addr_street?: string;
    highway: string;
    lanes?: string;
    name?: string;
    oneway?: string;
    source?: string;
    surface?: string;
  };
  name: string;
}

const RouteSchema = new Schema<Route>({
  id: { type: Number, required: true },
  nodes: [
    {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
  ],
  tags: {
    addr_street: { type: String },
    highway: { type: String, required: true },
    lanes: { type: String },
    name: { type: String },
    oneway: { type: String },
    source: { type: String },
    surface: { type: String },
  },
  name: { type: String },
}, { collection: 'route' });

interface processedRoute {
  id: number;
  type: string;
  name: string;
  nodes: Node[];
}

interface Node {
  lat: number;
  lon: number;
}

// MongoDB client setup
const routeModel = mongoose.model<Route>('route', RouteSchema);

app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');

mongoose.connect(MONGO_URI)
  .then(() => {
    app.get('/api/routes', async (req: Request, res: Response) => {
      try {
        const RoutesCursor = await routeModel.find({}).exec();

        const processedRoutes = RoutesCursor.map(route => {
          const { nodes, tags, name } = route;

          return {
            type: tags.highway,
            name: name || '',
            nodes: nodes,
          };
        });

        res.status(200).json(processedRoutes);
      } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ message: 'Failed to fetch routes', error });
      }
    });

    // Start the server
    app.listen(PORT_ROUTES, () => {
      console.log(`API is running on http://localhost:${PORT_ROUTES}/api/routes`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
  });
