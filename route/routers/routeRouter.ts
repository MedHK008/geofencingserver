import express from 'express';
import { getRouteLight } from '../controllers/routeController';

const trafficLightRoute = express.Router();
trafficLightRoute.get('/', getRouteLight);

export default trafficLightRoute;