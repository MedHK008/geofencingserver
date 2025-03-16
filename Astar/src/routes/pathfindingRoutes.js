const express = require('express');
const router = express.Router();
const { sendRoutes, findPath } = require('../controllers/pathfindingController');
const config = require('../config/config');

router.post(config.sendRoutesApi, sendRoutes);
router.post(config.astarApi, findPath);

module.exports = router;