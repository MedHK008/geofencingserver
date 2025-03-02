import express, { Request, Response } from 'express';
import env from 'dotenv';
import cors from 'cors';
import { connectToDB } from './config/db';
import zonesWithRisc from './routers/riscRoute';

env.config();
const PORT_RISC = process.env.PORT_RISC;
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');
connectToDB();
app.use('/api/buildingRisc', zonesWithRisc);
app.listen(PORT_RISC, () => {
    console.log(`API is running on port localhost:${PORT_RISC}/api/buildingRisc`);
});
