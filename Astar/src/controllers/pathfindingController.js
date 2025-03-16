const { createGraph } = require('../services/graphService');
const { astar } = require('../services/astarService');

// In-memory cache for routes and graph
let cachedRoutes = null;
let cachedGraph = null;

/**
 * Handle sending routes to cache
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function sendRoutes(req, res) {
  try {
    cachedRoutes = req.body.routes || [];
    cachedGraph = null; // Invalidate cached graph
    res.json({ message: 'Routes data received', routeCount: cachedRoutes.length });
  } catch (error) {
    console.error('Error in sendRoutes:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
}

/**
 * Handle A* pathfinding request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function findPath(req, res) {
  try {
    const { start, end, routes } = req.body;
    console.log('Request payload:', { start, end, routeCount: routes?.length });

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end points are required' });
    }

    let routesToUse = cachedRoutes;
    if (routes && routes.length > 0) {
      routesToUse = routes;
      cachedRoutes = routes; // Update cache
      cachedGraph = null; // Invalidate cached graph
    }

    if (!routesToUse || routesToUse.length === 0) {
      return res.status(400).json({ error: 'No routes data available' });
    }

    if (!cachedGraph) {
      console.log('Creating graph...');
      cachedGraph = createGraph(routesToUse);
      console.log('Graph created');
    } else {
      console.log('Using cached graph');
    }

    console.log('Running A* algorithm...');
    const startKey = `${start.lat},${start.lon}`;
    const endKey = `${end.lat},${end.lon}`;
    const result = astar(cachedGraph, startKey, endKey);
    console.log('A* algorithm completed');

    res.json(result);
  } catch (error) {
    console.error('Error in A* pathfinding:', error);
    res.status(500).json({ error: `Failed to find path: ${error.message}` });
  }
}

module.exports = { sendRoutes, findPath };