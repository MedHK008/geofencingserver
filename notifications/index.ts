import express from 'express';
import cors from 'cors'; 
import dotenv from 'dotenv';
import zoneRoutes from './routers/zoneNotifications';
import getNortifications from './routers/notificationsList';
import { connectToDB } from './config/db';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

connectToDB();

app.use('/api', zoneRoutes);
app.use('/api/notifications', getNortifications);

const PORT = process.env.PORT ;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
