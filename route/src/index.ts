import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose, { Document, Schema } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI as string;

const app = express();
const PORT_ROUTES: number = parseInt(process.env.PORT_ROUTES as string, 10);


interface Route extends Document {
    id: number;
    nodes: number[];
    tags: { highway: string };
    name: string;
    }

const RouteSchema = new Schema<Route>({
    id: { type: Number, required: true },
    nodes: { type: [Number], required: true },
    tags: { type: { highway: String }, required: true },
    name: { type: String }
    },{ collection: 'route' });

interface processedRoute {
    id: number;
    type: string;
    name: string;
    nodes: Node[];
    }

interface Node {
    id: number;
    lat: number;
    lon: number;
    }

const nodeSchema = new Schema<Node>({
    id: { type: Number, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
    },{ collection: 'routes_nodes' });

// MongoDB client setup
const routeModel = mongoose.model<Route>('route', RouteSchema);
const nodeModel = mongoose.model<Node>('routes_nodes', nodeSchema);


app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');

    app.get('/api/routes', async (req: Request, res: Response) => {
    
      try {
        const RoutesCursor = await routeModel.find({}).exec();
        const NodesCursor = await nodeModel.find({}).exec();
    
        console.log('Number of routes:', RoutesCursor.length);
        console.log('Number of nodes:', NodesCursor.length);

        if (RoutesCursor.length > 0) console.log('First route nodes:', RoutesCursor[0].nodes);
    
        const nodeMap = new Map(
          NodesCursor.map(node => {
            const id = typeof node.id === 'object' && '$numberLong' in node.id
              ? node.id.$numberLong
              : String(node.id);
            return [id, { lat: node.lat, lon: node.lon }];
          })
        );
    
        const processedRoutes = RoutesCursor.map(route => {
          const { nodes, tags, name } = route;
    
          const normalizedNodes = nodes.map(node =>
            typeof node === 'object' && node !== null && '$numberLong' in node ? (node as any).$numberLong : String(node)
          );
    
          const enrichedNodes = normalizedNodes
            .map(nodeId => nodeMap.get(nodeId))
            .filter(coord => coord !== undefined);
    
          return {
            type: tags.highway,
            name: name || '',
            nodes: enrichedNodes
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
