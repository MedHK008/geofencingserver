import express from "express";
import { ReadFile } from "../controllers/TimeController";

const test = express.Router();

test.get('/test', ReadFile);

export default test;