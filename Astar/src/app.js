const express = require('express');
const cors = require('cors');
const pathfindingRoutes = require('./routes/pathfindingRoutes');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(pathfindingRoutes);

module.exports = app;