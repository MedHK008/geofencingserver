import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import zoneRoutes from './routers/zoneNotifications';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON requests

// Include the zone routes
app.use('/api', zoneRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
