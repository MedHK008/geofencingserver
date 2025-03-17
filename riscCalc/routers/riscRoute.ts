import express from "express";
import { getZonesWithRisc } from "../controllers/riscController";

const zonesWithRisc = express.Router();

zonesWithRisc.post('/risc', getZonesWithRisc);

export default zonesWithRisc;

