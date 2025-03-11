import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectToDB } from './config/db'
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routeRouter from './routers/routeRouter'

dotenv.config();


const app = express();
const PORT_ROUTES = process.env.PORT_ROUTES;
app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
connectToDB()
app.use('/api/routes', routeRouter);
app.listen(PORT_ROUTES,
  () => {
    console.log(`API is running on port localhost:${PORT_ROUTES}/api/routes`);
  }
)
