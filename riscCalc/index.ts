import express from 'express';
import env from 'dotenv';
import cors from 'cors';
import { connectToDB } from './config/db';
import zonesWithRisc from './routers/riscRoute';
import organizeDbRoute from './routers/organizeDbRoute';
import mongoose from 'mongoose';
import expressWs, { Application } from 'express-ws';
import { WebSocket } from 'ws';


env.config();
const PORT_RISC = process.env.PORT_RISC;
const app = express() as any;
app.use(cors({ origin: '*' }));
app.set('view engine', 'ejs');
const wsApp = expressWs(app);

export const clients = new Set<WebSocket>();

// Configuration du middleware
app.use(express.json());

// Fonction WebSocket
app.ws('/risk-updates', (ws: WebSocket, req: Request) => {
    // Ajouter le client à la liste
    clients.add(ws);
    
    // Quand le client se déconnecte
    ws.on('close', () => {
        clients.delete(ws);
    });
    
    // Gestion des erreurs
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
})




mongoose.set('strictQuery', true);
connectToDB();
app.use('/api/buildingRisc', zonesWithRisc);
app.use('/api/organizeDB', organizeDbRoute);
app.listen(PORT_RISC, () => {
    console.log(`Server is running on port ${PORT_RISC}`);
    console.log(`http://localhost:${PORT_RISC}/api/buildingRisc`);
    console.log(`http://localhost:${PORT_RISC}/api/organizeDB`);
});


