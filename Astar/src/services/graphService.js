const { calculateDistance } = require('../utils/distance');

/**
 * Creates a graph from route data for A* algorithm
 * @param {Array} routes - Array of route objects
 * @returns {Object} Graph representation
 */
function createGraph(routes) {
  const graph = {};
  console.log(`Creating graph with ${routes.length} routes`);

  routes.forEach((route, index) => {
    if (!route.nodes || !Array.isArray(route.nodes) || route.nodes.length < 2) {
      console.warn(
        `Skipping invalid route at index ${index}: Missing or invalid nodes`
      );
      return;
    }

    const nodes = route.nodes;
    for (let i = 0; i < nodes.length - 1; i++) {
      const node1 = nodes[i];
      const node2 = nodes[i + 1];
      if (!node1.lat || !node1.lon || !node2.lat || !node2.lon) {
        console.warn(
          `Skipping invalid node pair at route ${index}, position ${i}: Missing lat/lon`
        );
        continue;
      }

      const key1 = `${node1.lat},${node1.lon}`;
      const key2 = `${node2.lat},${node2.lon}`;
      const distance = calculateDistance(node1, node2);

      if (!graph[key1]) graph[key1] = [];
      if (!graph[key2]) graph[key2] = [];

      graph[key1].push({ node: key2, cost: distance });

      if (!route.tags || route.tags.oneway !== 'yes') {
        graph[key2].push({ node: key1, cost: distance });
      }
    }
  });

  console.log(`Graph created with ${Object.keys(graph).length} nodes`);
  return graph;
}

module.exports = { createGraph };