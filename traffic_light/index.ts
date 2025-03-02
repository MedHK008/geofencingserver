import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectToDB } from './config/db'
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import trafficLightRoute from './routes/trafficLightRoute';

dotenv.config();


const app = express();
const PORT_TRAFFICS = process.env.PORT_TRAFFICS;
app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
connectToDB()
app.use('/api/trafficLights', trafficLightRoute);
app.listen(PORT_TRAFFICS,
  () => {
    console.log(`Server is Hosting from port ${PORT_TRAFFICS}`);
  }
)
