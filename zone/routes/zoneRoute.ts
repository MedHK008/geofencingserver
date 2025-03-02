import express from "express";
import { getZones } from "../controllers/zoneController";

const zoneRoute = express.Router();

zoneRoute.get('/', getZones);

export default zoneRoute;
