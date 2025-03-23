import express from "express";
import { getZonesWithRisc } from "../controllers/riscController";
import { getWeatherApi } from "../controllers/weatherRoute";

const zonesWithRisc = express.Router();

zonesWithRisc.post('/risc', getZonesWithRisc);
zonesWithRisc.get('/weather', getWeatherApi)

export default zonesWithRisc;
