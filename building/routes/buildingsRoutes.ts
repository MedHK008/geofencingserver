import express from "express";
import { getBuildings } from "../controllers/buildingsControllers";

const buildingRoute = express.Router();

buildingRoute.get('/', getBuildings);
export default buildingRoute;