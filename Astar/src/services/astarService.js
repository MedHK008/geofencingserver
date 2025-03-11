const PriorityQueue = require('js-priority-queue');
const { calculateDistance } = require('../utils/distance');

/**
 * Finds the closest node in the graph to a given point
 * @param {Object} graph - Graph representation
 * @param {Object} point - Point with lat/lon
 * @returns {string|null} Closest node key or null if graph is empty
 */
function findClosestNode(graph, point) {
  let closestNode = null;
  let minDistance = Infinity;

  for (const node in graph) {
    const [nodeLat, nodeLon] = node.split(',').map(parseFloat);
    const distance = calculateDistance({ lat: nodeLat, lon: nodeLon }, point);

    if (distance < minDistance) {
      minDistance = distance;
      closestNode = node;
    }
  }

  return closestNode;
}

/**
 * Heuristic function for A* (Haversine distance)
 * @param {Object} point1 - First point with lat/lon
 * @param {Object} point2 - Second point with lat/lon
 * @returns {number} Estimated distance
 */
function heuristic(point1, point2) {
  return calculateDistance(point1, point2);
}

/**
 * A* algorithm implementation
 * @param {Object} graph - Graph representation
 * @param {string} start - Start node key
 * @param {string} end - End node key
 * @param {number} [timeoutMs=5000] - Timeout in milliseconds
 * @returns {Object} Path and distance
 * @throws {Error} If no path is found or computation times out
 */
function astar(graph, start, end, timeoutMs = 5000) {
  const startTime = Date.now();
  const startCoords = start.split(',').map((coord) => parseFloat(coord));
  const endCoords = end.split(',').map((coord) => parseFloat(coord));

  let startKey = start;
  let endKey = end;

  if (!graph[start]) {
    startKey = findClosestNode(graph, { lat: startCoords[0], lon: startCoords[1] });
  }
  if (!graph[end]) {
    endKey = findClosestNode(graph, { lat: endCoords[0], lon: endCoords[1] });
  }

  if (!startKey || !endKey) {
    throw new Error('No valid start or end node found in the graph');
  }

  const openSet = new PriorityQueue({ comparator: (a, b) => a.f - b.f });
  const closedSet = new Set();// Set to track visited nodes
  const gScore = new Map();// Map to track the cost to reach a node
  const fScore = new Map();// Map to track the total cost of a node
  const cameFrom = new Map();// Map to track the path

  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(
    { lat: startCoords[0], lon: startCoords[1] },
    { lat: endCoords[0], lon: endCoords[1] }
  ));

  openSet.queue({ node: startKey, f: fScore.get(startKey) });

  while (openSet.length > 0) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('A* computation timed out');
    }

    const current = openSet.dequeue().node;// Get the node with the lowest f score

    if (current === endKey) {// Reached the end node
      const path = [];
      let currentNode = current;

      while (currentNode) {
        path.unshift(currentNode);
        currentNode = cameFrom.get(currentNode);// Get the previous node
      }

      return {
        path: path.map((node) => {
          const [lat, lon] = node.split(',').map(parseFloat);
          return { lat, lon };
        }),
        distance: gScore.get(endKey) || 0,
      };
    }

    closedSet.add(current);

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.node)) continue;

      const tentativeGScore = (gScore.get(current) || 0) + neighbor.cost;

      if (!gScore.has(neighbor.node) || tentativeGScore < gScore.get(neighbor.node)) {
        cameFrom.set(neighbor.node, current);
        gScore.set(neighbor.node, tentativeGScore);

        const neighborCoords = neighbor.node.split(',').map(parseFloat);
        fScore.set(neighbor.node, tentativeGScore + heuristic(
          { lat: neighborCoords[0], lon: neighborCoords[1] },
          { lat: endCoords[0], lon: endCoords[1] }
        ));

        openSet.queue({ node: neighbor.node, f: fScore.get(neighbor.node) });
      }
    }
  }

  throw new Error('No path found');
}

module.exports = { astar, findClosestNode };