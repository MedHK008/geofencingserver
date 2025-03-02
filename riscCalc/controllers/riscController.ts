import { Request, Response } from "express";
import { Building, BuildingType, Route, RouteType, Zone, ZoneType, TrafficLight } from "../modules/riscModule";
import { TRAFFIC_RISC_CAR, TRAFFIC_RISC_PEDESTRIAN } from "../config/constants";
import { ProcessedRoute, ProcessedZone, Node } from "../interfaces/interfaces";

const routeFromProcessedRoutes = (routes: any[]): ProcessedRoute[] => {
    const processedRoutes = routes.map((route): ProcessedRoute => {
        return {
            id: route.id || 0, // Provide fallback for missing id
            type: route.tags.highway, // Fallback for missing type
            nodes: route.nodes, // Ensure valid nodes
        };
    });
    return processedRoutes;
};

const zoneFromProcessedZones = (zones: any[]): ProcessedZone[] => {
    const processedZones: ProcessedZone[] = zones.map((zone): ProcessedZone => {
        return {
            id: zone.id,
            type: zone.tags.landuse || zone.tags.leisure || zone.tags.natural || 'unknown',
            nodes: zone?.geometry // Include geometry in the response
        };
    });
    return processedZones;
};

const joinBuildingAndTypes = async () => {
    try {
      const buildings = await Building.find();
      const buildingTypes = await BuildingType.find();
  
      const joinedData = buildings.map(building => {
        const buildingType = buildingTypes.find(type => type.type === building.type);
        return {
          ...building.toObject(),
          pedestrian: buildingType?.pedestrian || 0,
          car: buildingType?.car || 0
        };
      });
  
      return joinedData;
    } catch (error) {
      console.error('Error joining building and types:', error);
      throw error;
    }
};

const joinRouteAndTypes = async () => {
    try {
        const routes = routeFromProcessedRoutes(await Route.find());
        const routeTypes = await RouteType.find();

        const joinedData = routes.map(route => {
            const routeType = routeTypes.find(type => type.type === route.type);
            return {
                ...route,
                pedestrian: routeType?.pedestrian || 0,
                car: routeType?.car || 0
            };
        });
        return joinedData;
    } catch (error) {
        console.error('Error joining route and types:', error);
        throw error;
    }
};

const joinZoneAndTypes = async () => {
    try {
        const zones = zoneFromProcessedZones(await Zone.find());
        const zoneTypes = await ZoneType.find();

        const joinedData = zones.map(zone => {
            const zoneType = zoneTypes.find(type => type.type === zone.type);
            return {
                ...zone,
                pedestrian: zoneType?.pedestrian || 0,
                car: zoneType?.car || 0
            };
        });

        return joinedData;
    } catch (error) {
        console.error('Error joining zone and types:', error);
        throw error;
    }
};

const joinTrafficLight = async () => {
    try {
        const trafficLights = await TrafficLight.find();
        const trafficLightsWithRisc = trafficLights.map(trafficLight => {
            return {
                ...trafficLight.toObject(),
                pedestrian: TRAFFIC_RISC_PEDESTRIAN,
                car: TRAFFIC_RISC_CAR
            };
        });
        return trafficLightsWithRisc;
    } catch (error) {
        console.error('Error joining traffic lights:', error);
        throw error;
    }
};

/**
 * Determine if a point is inside a polygon using the ray-casting algorithm.
 * 
 * Iterate over each edge of the polygon. For each edge, check if the ray crosses it.
 * More specifically, for an edge between (xi, yi) and (xj, yj), determine if the edge straddles the horizontal line through y 
 * (i.e., one endpoint is above y and the other below y).
 * If so, compute the x-coordinate of the intersection of the edge with the horizontal line using linear interpolation:
 * x_intersect = xi + ((y - yi) / (yj - yi)) * (xj - xi)
 * If x < x_intersect, it means the ray from (x, y) to infinity crosses this edge. Count the crossing.
 * After processing all edges, if the total number of crossings is odd, the point is inside the polygon; if it is even, the point is outside.
 * 
 * @param pointCoords - The coordinates of the point to check.
 * @param zoneCoords - The coordinates of the polygon's vertices.
 * @returns True if the point is inside the polygon, false otherwise.
 */
function isPointInZone(pointCoords: Node, zoneCoords: Node[]): boolean {
    const {lat: y, lon: x } = pointCoords;
    let inside = false;
    const n = zoneCoords.length;

    for(let i=0,j=n-1;i<n;j=i++){
        const xi = zoneCoords[i].lon, yi=zoneCoords[i].lat;
        const xj = zoneCoords[j].lon, yj=zoneCoords[j].lat;
        // ((yi > y) !== (yj > y)) to make sure that the point we are checking is between the two points of the edge
        // (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) to make sure that the point is on the right side of the edge 
        const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}

export const ProcessedZonesWithRisc = async() => {
    let buildings = await joinBuildingAndTypes();
    const processedRoutes = await joinRouteAndTypes();
    const processedZones = await joinZoneAndTypes();
    let trafficLights = await joinTrafficLight();

    try {
        processedZones.forEach(zone => {
            console.log('Processing zone:', zone.id);
            buildings.forEach(building => {
                if (isPointInZone({lat: building.lat, lon: building.lon}, zone.nodes)) {
                    zone.pedestrian += building.pedestrian;
                    zone.car += building.car;
                    buildings = buildings.filter(b => b.id !== building.id);
                    console.log('Building inside zone:', building.id);
                }
            });
    
            for (const route of processedRoutes) {
                let inside = false;
                for (const node of route.nodes) {
                    if (isPointInZone(node, zone.nodes)) {
                        inside = true;
                        route.nodes = route.nodes.filter(n => n.lat !== node.lat && n.lon !== node.lon);
                        break;
                    }
                }
                if (inside) {
                    zone.pedestrian += route.pedestrian;
                    zone.car += route.car;
                }
                console.log('Route inside zone:', route.id);
            }
    
            trafficLights.forEach(trafficLight => {
                if (isPointInZone({lat: trafficLight.lat, lon: trafficLight.lon}, zone.nodes)) {
                    zone.pedestrian += trafficLight.pedestrian;
                    zone.car += trafficLight.car;
                    trafficLights = trafficLights.filter(tl => tl.id !== trafficLight.id);
                    console.log('Traffic light inside zone:', trafficLight.id);
                }
            });
        });
        return processedZones;
    } catch (error) {
        console.error('Error calculating RISC for zones:', error);
    }

};

const getZonesWithRisc = async(req: Request, res: Response) => {
    try {
        const processedZones = await ProcessedZonesWithRisc();
        if (!processedZones) {
            res.status(500).json({ success: false, message: 'Error processing zones' });
            return;
        }
        const zonesWithoutNodes = processedZones.map(zone => {
            const { nodes, ...zoneWithoutNodes } = zone;
            return zoneWithoutNodes;
        });
        res.status(200).json({ success: true, processedZones: zonesWithoutNodes });
    } catch (error) {
        console.error('Error getting zones with RISC:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export { getZonesWithRisc };

