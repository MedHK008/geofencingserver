import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectToDB } from './config/db'
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import buildingRoute from './routes/buildingsRoutes';


dotenv.config();


const app = express();
const PORT_BUILDINGS = process.env.PORT_BUILDINGS;
app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
connectToDB()
app.use('/api/buildings', buildingRoute);
app.listen(PORT_BUILDINGS,
  () => {
    console.log(`API is running on port localhost:${PORT_BUILDINGS}/api/buildings`);
  }
)
