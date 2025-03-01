import mongoose from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());


dotenv.config();

const MONGO_URI: string = process.env.MONGO_URI as string;
const PORT_RISC = parseInt(process.env.PORT_RISC as string, 10);

interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number];
}

interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// Building Schema
interface BuildingDocument extends mongoose.Document {
  id: number;
  type: string;
  location: GeoJSONPoint;
}

const buildingSchema = new mongoose.Schema<BuildingDocument>({
  id: Number,
  type: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
}, { collection: 'building' });

const Building = mongoose.model<BuildingDocument>('building', buildingSchema);

// Route Schema
interface RouteNode extends GeoJSONPoint {}

interface RouteDocument extends mongoose.Document {
  id: number;
  nodes: RouteNode[];
  tags: {
    highway?: string;
  };
  type: string;
}

const routeSchema = new mongoose.Schema<RouteDocument>({
  id: Number,
  nodes: [{
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  }],
  tags: mongoose.Schema.Types.Mixed,
  type: String,
},{ collection: 'route' });

const Route = mongoose.model<RouteDocument>('route', routeSchema);

// Zone Schema
interface ZoneDocument extends mongoose.Document {
  id: number;
  geometry: GeoJSONPolygon;
  tags: {
    natural?: string;
    landuse?: string;
    leisure?: string;
  };
  type: string;
  pedestrian_risk?: number;
  car_risk?: number;
}

const zoneSchema = new mongoose.Schema<ZoneDocument>({
  id: Number,
  geometry: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true,
    },
    coordinates: {
      type: [[[Number]]],
      required: true,
    },
  },
  tags: mongoose.Schema.Types.Mixed,
  type: String,
  pedestrian_risk: Number,
  car_risk: Number,
}, { collection: 'zone' });

zoneSchema.index({ geometry: '2dsphere' });
const Zone = mongoose.model<ZoneDocument>('zone', zoneSchema);

// Type Schemas
interface BuildingTypeDocument extends mongoose.Document {
  type: string;
  pedestrian: number;
  car: number;
}

const buildingTypeSchema = new mongoose.Schema<BuildingTypeDocument>({
  type: String,
  pedestrian: Number,
  car: Number,
},{ collection: 'buildings_types' });

const BuildingType = mongoose.model<BuildingTypeDocument>('buildings_types', buildingTypeSchema);

interface RouteTypeDocument extends mongoose.Document {
  type: string;
  pedestrian: number;
  car: number;
}

const routeTypeSchema = new mongoose.Schema<RouteTypeDocument>({
  type: String,
  pedestrian: Number,
  car: Number,
},{ collection: 'routes_types' });

const RouteType = mongoose.model<RouteTypeDocument>('routes_types', routeTypeSchema);

interface ZoneTypeDocument extends mongoose.Document {
  type: string;
  pedestrian: number;
  car: number;
}

const zoneTypeSchema = new mongoose.Schema<ZoneTypeDocument>({
  type: String,
  pedestrian: Number,
  car: Number,
},{ collection: 'zones_types' });

const ZoneType = mongoose.model<ZoneTypeDocument>('zones_types', zoneTypeSchema);
// Risk Calculation Function
async function calculateZoneRisks() {
    try {
        console.log('Starting risk calculation');
        console.log('Connection state:', mongoose.connection.readyState);
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB not connected');
        }

        const buildingTypes = await BuildingType.find().exec();
        const buildingTypeMap = new Map(buildingTypes.map(bt => [bt.type, bt]));

        const routeTypes = await RouteType.find().exec();
        const routeTypeMap = new Map(routeTypes.map(rt => [rt.type, rt]));

        const zoneTypes = await ZoneType.find().exec();
        const zoneTypeMap = new Map(zoneTypes.map(zt => [zt.type, zt]));

        const zones = await Zone.find().exec();
        console.log(`Found ${zones.length} zones`);

        for (const zone of zones) {
            const zoneType = zoneTypeMap.get(zone.type);
            let pedestrianRisk = zoneType?.pedestrian || 0;
            let carRisk = zoneType?.car || 0;

            const buildings = await Building.find({
                location: { $geoWithin: { $geometry: zone.geometry } },
            }).exec();
            console.log(`Found ${buildings.length} buildings in zone ${zone.id}`);

            for (const building of buildings) {
                const buildingType = buildingTypeMap.get(building.type);
                if (buildingType) {
                    pedestrianRisk += buildingType.pedestrian;
                    carRisk += buildingType.car;
                }
            }

            const routes = await Route.find({
                'nodes.coordinates': { $geoWithin: { $geometry: zone.geometry } },
            }).exec();
            console.log(`Found ${routes.length} routes in zone ${zone.id}`);

            for (const route of routes) {
                const routeType = routeTypeMap.get(route.type);
                if (routeType) {
                    pedestrianRisk += routeType.pedestrian;
                    carRisk += routeType.car;
                }
            }

            await Zone.updateOne(
                { _id: zone._id },
                { $set: { pedestrian_risk: pedestrianRisk, car_risk: carRisk } }
            );
        }

        console.log('Risk calculation completed for all zones.');
    } catch (error) {
        console.error('Error in calculateZoneRisks:', error);
        throw error;
    }
}
  
  // API Endpoint
  app.get('/api/zones/risks', async (req, res) => {
    try {
      const zones = await Zone.find({}, 'id pedestrian_risk car_risk').lean();
      const response = zones.map(zone => ({
        zone_id: zone.id,
        pedestrian_risk: zone.pedestrian_risk || 0,
        car_risk: zone.car_risk || 0,
      }));
      res.status(200).json(response);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Failed to fetch zone risks' });
    }
  });
  
  // Single Connection and Server Startup
  mongoose.connect(MONGO_URI, {})
    .then(async () => {
      console.log('MongoDB connected');
      await calculateZoneRisks(); // Run risk calculation once on startup
      app.listen(PORT_RISC, () => {
        console.log(`API server running on http://localhost:${PORT_RISC}/api/zones/risks`);
      });
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1); // Exit if connection fails
    });