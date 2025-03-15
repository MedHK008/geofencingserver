import mongoose from 'mongoose';

const BuildingSchema = new mongoose.Schema
({
    id: { type: Number, required: true },
    type: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
});

const BuildingTypeSchema = new mongoose.Schema
({
    type: { type: String, required: true },
    pedestrian: { type: Number, required: true },
    car: { type: Number, required: true }
});

const RouteSchema = new mongoose.Schema
({
    id: { type: Number, required: true },
    nodes: [{ lat: { type: Number, required: true }, lon: { type: Number, required: true } }],
    tags: { type: Object, required: true }
});

const RouteTypeSchema = new mongoose.Schema
({
    type: { type: String, required: true },
    pedestrian: { type: Number, required: true },
    car: { type: Number, required: true }
});

const ZoneSchema = new mongoose.Schema
({
    id: { type: Number, required: true },
    geometry: [{ lat: { type: Number, required: true }, lon: { type: Number, required: true } }],
    tags: {
      landuse: { type: String, required: false },
      leisure: { type: String, required: false },
      natural: { type: String, required: false }
    },
    buildings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Building' }],
    routes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
    trafficLights: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TrafficLight' }]
});
  
const ZoneTypeSchema = new mongoose.Schema
({
    type: { type: String, required: true },
    pedestrian: { type: Number, required: true },
    car: { type: Number, required: true },
    
      
});


const trafficLightSchema = new mongoose.Schema
({
    id: { type: Number, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
});

export const Building = mongoose.models.buildings || mongoose.model('buildings', BuildingSchema);
export const BuildingType = mongoose.models.buildings_types || mongoose.model('buildings_types', BuildingTypeSchema);

export const Route = mongoose.models.routes || mongoose.model('routes', RouteSchema);
export const RouteType = mongoose.models.routes_types || mongoose.model('routes_types', RouteTypeSchema);

export const Zone = mongoose.models.zones || mongoose.model('zones', ZoneSchema);
export const ZoneType = mongoose.models.zones_types || mongoose.model('zones_types', ZoneTypeSchema);

export const TrafficLight = mongoose.models.traffic || mongoose.model('traffic_lights', trafficLightSchema);