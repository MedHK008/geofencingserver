import express from 'express';
import env from 'dotenv';
import cors from 'cors';
import weatherRouter from './Router/weatherRouter';


env.config();
const PORT_WEATHER = process.env.PORT_WEATHER;
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use('/api', weatherRouter)
app.listen(PORT_WEATHER, () => {
    console.log(`API is running on port localhost:${PORT_WEATHER}/api/weather`);
});