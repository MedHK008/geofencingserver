import { Request, Response } from "express";
import { Building, BuildingType, Route, RouteType, Zone, ZoneType, TrafficLight } from "../modules/riscModule";
import { TRAFFIC_RISC_CAR, TRAFFIC_RISC_PEDESTRIAN } from "../config/constants";
import { ProcessedRoute, ProcessedZone, Node } from "../interfaces/interfaces";
import { checkTimeForRoute, checkTimeForBuilding, checkAdhanTime, checkTimeForZone } from './TimeController';
import mongoose from "mongoose";

const routeFromProcessedRoutes = (routes: any[]): ProcessedRoute[] => {
    const processedRoutes = routes.map((route): ProcessedRoute => {
        return {
            _id: route._id,
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
            nodes: zone?.geometry || [],
            Buildings:zone.buildings,
            Routes:zone.routes,
            TrafficLights:zone.trafficLights
        };
    });
    return processedZones;
};

const joinBuildingAndTypes = async () => {
    try {
        const buildings = await Building.find();
        let buildingTypes = await BuildingType.find();

        buildingTypes = buildingTypes.map(buildingType => checkTimeForBuilding(buildingType));

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
        let routeTypes = await RouteType.find();

        routeTypes = routeTypes.map(routeType => checkTimeForRoute(routeType));

        const joinedData = routes.map(route => {
            const routeType = routeTypes.find(type => type.type === route.type);
            return {
                ...route,
                _id: route._id,
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
        // const zones = zoneFromProcessedZones(await Zone.find());
        const allZones = await Zone.find();
        const zones = zoneFromProcessedZones(allZones.filter(zone => zone.id === 57901847));//@ changer 
        let zoneTypes = await ZoneType.find();

        zoneTypes = zoneTypes.map(zoneType => checkTimeForZone(zoneType));

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
    const { lat: y, lon: x } = pointCoords;
    let inside = false;
    const n = zoneCoords.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = zoneCoords[i].lon, yi = zoneCoords[i].lat;
        const xj = zoneCoords[j].lon, yj = zoneCoords[j].lat;
        // ((yi > y) !== (yj > y)) to make sure that the point we are checking is between the two points of the edge
        // (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) to make sure that the point is on the right side of the edge 
        const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
    }
    return inside;
}
const organizeDb = async (req: Request, res: Response) => {
    try {
        let buildings = await Building.find();
        let routes = await Route.find();
        let zones = await Zone.find();
        let trafficLights = await TrafficLight.find();

        await Promise.all(zones.map(async (zone) => {
            let buildingArray: number[] = [];
            let routesArray: number[] = [];
            let trafficLightsArray: number[] = [];
        
            // Filter Buildings
            buildings = buildings.filter(building => {
                if (isPointInZone({ lat: building.lat, lon: building.lon }, zone.geometry)) {
                    buildingArray.push(building._id);
                    return false;
                }
                return true;
            });
        
            // Filter Routes
            routes = routes.map(route => {
                const originalNodeCount = route.nodes.length;
                route.nodes = route.nodes.filter((node: Node) => !isPointInZone(node, zone.geometry));
                if (route.nodes.length < originalNodeCount) {
                    routesArray.push(route._id);
                }
                return route;
            }).filter(route => route.nodes.length > 0);
        
            // Filter Traffic Lights
            trafficLights = trafficLights.filter(trafficLight => {
                if (isPointInZone({ lat: trafficLight.lat, lon: trafficLight.lon }, zone.geometry)) {
                    trafficLightsArray.push(trafficLight._id);
                    return false;
                }
                return true;
            });
        
            // Vérifier si des valeurs existent avant la mise à jour
            console.log(zone.id,buildingArray, routesArray, trafficLightsArray);
            if (buildingArray.length > 0 || routesArray.length > 0 || trafficLightsArray.length > 0) {
                try {
                    const result = await Zone.updateOne(
                        { _id: zone._id },
                        { $addToSet: { buildings: { $each: buildingArray }, routes: { $each: routesArray }, trafficLights: { $each: trafficLightsArray } } }
                    );
                    
                    console.log(`🔍 Documents modifiés: ${result.modifiedCount}`);                    
                    console.log(`✅ Mise à jour de la zone ${zone.id} réussie !`);
                } catch (error) {
                    console.error(`❌ Erreur lors de la mise à jour de la zone ${zone.id}:`, error);
                }                
            } else {
                console.log(`⚠️ Aucun changement pour la zone ${zone.id}`);
            }
            
        }));
        res.status(200).json({ message: "OK" });        
    } catch (error) {
        console.error("Error in organizeDb:", error);
        res.status(500).json({ message: "NO" });
    }
};

const joinZoneAndComponents = async () => {
    let buildings = await joinBuildingAndTypes();
    let processedRoutes = await joinRouteAndTypes();
    let processedZones = await joinZoneAndTypes();
    let trafficLights = await joinTrafficLight();
    return processedZones.map(zone => {
        return {
            ...zone,
            buildings: buildings.filter(building => zone.Buildings.includes(building._id)),
            routes: processedRoutes.filter(route => zone.Routes.includes(route._id)),
            trafficLights: trafficLights.filter(light => zone.TrafficLights.includes(light._id))
        };
    });
};



export const ProcessedZonesWithRisc = async () => {
    /*let buildings = await joinBuildingAndTypes();
    let processedRoutes = await joinRouteAndTypes();
    let processedZones = await joinZoneAndTypes();
    let trafficLights = await joinTrafficLight();*/
    let Zones = await joinZoneAndComponents();
    //console.log('before time check pedestrian:', processedZones[0].pedestrian);

    try {
        Zones.forEach(zone => {
            console.log('Processing zone:', zone.id);
            // console.log('after time check pedestrian:', zone.pedestrian);
            // console.log('after time check car:', zone.car);
            zone.buildings.forEach(building => {   
                    if (building.type === 'place_of_worship') {
                        console.log('place of worship found');
                    }
                    zone.pedestrian += building.pedestrian;
                    zone.car += building.car;
                    //buildings = buildings.filter(b => b.id !== building.id);
                
            });

            /*zone.routes.forEach(route => {
                zone.pedestrian += route.pedestrian;
                zone.car += route.car;
               // processedRoutes = processedRoutes.filter(r => r.id !== route.id);
            });*/

            zone.trafficLights.forEach(light => {
                zone.pedestrian += light.pedestrian;
                zone.car += light.car;
               // trafficLights = trafficLights.filter(tl => tl.id !== light.id);
            });
            console.log('after time check pedestrian:', zone.pedestrian);
            console.log('after time check car:', zone.car);

        });
        return Zones;
    } catch (error) {
        console.error('Error calculating RISC for zones:', error);
    }

};

const getZonesWithRisc = async (req: Request, res: Response) => {
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

export { getZonesWithRisc, organizeDb };

