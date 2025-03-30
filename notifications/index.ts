import express from 'express';
import cors from 'cors'; 
import dotenv from 'dotenv';
import zoneRoutes from './routers/zoneNotifications';
import { connectToDB } from './config/db';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

connectToDB();

app.use('/api', zoneRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
