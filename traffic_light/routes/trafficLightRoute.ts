import express from 'express';
import { getTrafficLight } from '../controllers/trafficLightController';

const trafficLightRoute = express.Router();
trafficLightRoute.get('/', getTrafficLight);


export default trafficLightRoute;