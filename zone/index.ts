import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectToDB } from './config/db'
import zoneRoute from './routes/zoneRoute'
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();


const app = express();
const PORT_ZONES =process.env.PORT_ZONES ;
app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
connectToDB()
app.use('/api/zones', zoneRoute);
app.listen(PORT_ZONES,
  () => {
    console.log(`API is running on port localhost:${PORT_ZONES}/api/zones`);
  }
)
