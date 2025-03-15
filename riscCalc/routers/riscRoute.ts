import express from "express";
import { getZonesWithRisc } from "../controllers/riscController";

const zonesWithRisc = express.Router();

zonesWithRisc.get('/risc', getZonesWithRisc);

export default zonesWithRisc;
