import express from 'express';
import env from 'dotenv';
import cors from 'cors';
import { connectToDB } from './config/db';
import zonesWithRisc from './routers/riscRoute';
import organizeDbRoute from './routers/organizeDbRoute';
import mongoose from 'mongoose';

env.config();
const PORT_RISC = process.env.PORT_RISC;
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);
connectToDB();
app.use('/api/buildingRisc', zonesWithRisc);
app.use('/api/organizeDB', organizeDbRoute);
app.listen(PORT_RISC, () => {
    console.log(`Server is running on port ${PORT_RISC}`);
    console.log(`http://localhost:${PORT_RISC}/api/buildingRisc`);
    console.log(`http://localhost:${PORT_RISC}/api/organizeDB`);
});


