import { Request, Response } from "express";
import { Building, BuildingType, Route, RouteType, Zone, ZoneType, TrafficLight } from "../modules/riscModule";
import { TRAFFIC_RISC_CAR, TRAFFIC_RISC_PEDESTRIAN } from "../config/constants";
import { ProcessedZone, Node, BuildingsTypes, RoutesTypes } from "../interfaces/interfaces";
import { ProcessedRoute } from "../src";
import { checkTimeForRoute, checkTimeForBuilding, checkAdhanTime, checkTimeForZone } from './TimeController';
import { clients } from "..";


const routeFromProcessedRoutes = (routes: any[]): ProcessedRoute[] => {
    const processedRoutes = routes.map((route): ProcessedRoute => {
        return {
            id: route.id || 0,        // Valeur par défaut si id est manquant
            type: route.tags.highway,  // 'unknown' si highway est manquant
            nodes: route.nodes || []  // Tableau vide si nodes est manquant
        };
    });
    return processedRoutes;
};
const zoneFromProcessedZones = (zones: any[]): ProcessedZone[] => {
    const processedZones: ProcessedZone[] = zones.map((zone): ProcessedZone => {
        return {
            zoneId: zone.zoneId,
            geometry: zone.geometry || [],  // Remplace 'nodes' par 'geometry'
            type: zone.tags.landuse,  // Garder la logique pour déterminer 'type'
            routes: new Map(Object.entries(zone.routes || {})),  // Convertir routes en Map si ce n'est pas déjà fait
            trafficLights: zone.trafficLights || 0,  // Convertir trafficLights en Map
            buildings: new Map(Object.entries(zone.buildings || {})),// Convertir buildings en Map
            boundingBox: zone.boundingBox || { minX: 0, minY: 0, maxX: 0, maxY: 0 }
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
        console.log("je suis dns joiture routes avant")
        const routes = routeFromProcessedRoutes(await Route.find());
        console.log("je suis dns joiture des routes apres")
        let routeTypes = await RouteType.find();

        routeTypes = routeTypes.map(routeType => checkTimeForRoute(routeType));

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
const joinZoneAndTypes = async (Zones: typeof Zone[]) => {
    try {
        // const zones = zoneFromProcessedZones(await Zone.find());
        //const allZones = await Zone.find();
        const zones = zoneFromProcessedZones(Zones);
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
const getBoundingBox = (geometry: Node[]) => {
    let minLon = Infinity,
      minLat = Infinity,
      maxLon = -Infinity,
      maxLat = -Infinity;
    geometry.forEach((point: any) => {
      const lon = point[0];
      const lat = point[1];
      if (lon === undefined || lat === undefined) return;
      minLon = Math.min(minLon, lon);
      minLat = Math.min(minLat, lat);
      maxLon = Math.max(maxLon, lon);
      maxLat = Math.max(maxLat, lat);
    });
    return { minX: minLon, minY: minLat, maxX: maxLon, maxY: maxLat };
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

function isPointInZone(pointCoords: Node, zoneGeometry: { "0": number; "1": number }[]): boolean {
    const { lat: y, lon: x } = pointCoords;
    let inside = false;
    const n = zoneGeometry.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = zoneGeometry[i]["0"], yi = zoneGeometry[i]["1"];
        const xj = zoneGeometry[j]["0"], yj = zoneGeometry[j]["1"];
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
            let buildingMap: Map<string, number> = new Map();
            let routeMap: Map<string, number> = new Map();
            let trafficLightnumber = 0;
            const boundingBox = getBoundingBox(zone.geometry);

            // Filter Buildings - Utiliser le type de bâtiment comme clé et compter les occurrences
            buildings = buildings.filter(building => {
                if (isPointInZone({ lat: building.lat, lon: building.lon }, zone.geometry)) {
                    // Utiliser 'building.type' comme clé
                    const type = building.type || 'unknown';
                    buildingMap.set(type, (buildingMap.get(type) || 0) + 1); // Incrémenter le compteur pour ce type
                    return false;
                }
                return true;
            });

            // Filter Routes - Utiliser le type de route comme clé et compter les occurrences
            routes = routes.map(route => {
                const originalNodeCount = route.nodes.length;
                route.nodes = route.nodes.filter((node: Node) => !isPointInZone(node, zone.geometry));
                if (route.nodes.length < originalNodeCount) {
                    const type = route.tags.highway;
                    routeMap.set(type, (routeMap.get(type) || 0) + 1); // Incrémenter le compteur pour ce type
                }
                return route;
            }).filter(route => route.nodes.length > 0);

            // Filter Traffic Lights - Utiliser le nom du feu de circulation comme clé et compter les occurrences
            trafficLights = trafficLights.filter(trafficLight => {
                if (isPointInZone({ lat: trafficLight.lat, lon: trafficLight.lon }, zone.geometry)) {
                    trafficLightnumber++;
                    return false;
                }
                return true;
            });

            // Vérifier si des valeurs existent avant la mise à jour
            console.log(zone.id, buildingMap, routeMap, trafficLightnumber,boundingBox);
            if (buildingMap.size > 0 || routeMap.size > 0 || trafficLightnumber > 0) {
                try {
                    const result = await Zone.updateOne(
                        { _id: zone._id },
                        {
                            $set: {
                                buildings: Object.fromEntries(buildingMap), // Convertir le Map en objet clé-valeur pour buildings
                                routes: Object.fromEntries(routeMap), // Convertir le Map en objet clé-valeur pour routes
                                trafficLights: trafficLightnumber ,// Mettre à jour le nombre de feux de circulation
                                boundingBox: boundingBox
                        }
                    }

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

const getRiskOfBuilding = (buildingTypes: BuildingsTypes[], type: string): { car: number, pedestrian: number } => {
    const building = buildingTypes.find(buildingType => buildingType.type === type);
    if (!building)
        return { car: 0, pedestrian: 0 };

    return { car: building.car, pedestrian: building.pedestrian };
}
const getRiskOfRoute = (routes: RoutesTypes[], type: string): { car: number, pedestrian: number } => {
    const route = routes.find(route => route.type === type);
    if (!route) {
        return { car: 0, pedestrian: 0 };
    }
    return { car: route.car, pedestrian: route.pedestrian };
}

// const getZonesWithRisc = async (req: Request, res: Response) => {
//     try {
//         //Prendre les zones vient de frontnd
//         let zones = await joinZoneAndTypes(req.body.zones)

//         let buildingTypes = await BuildingType.find()
//         let routeTypes = await RouteType.find()
        
//         zones.forEach(zone => {


//             const buildingsInZone = zone.buildings
//             const routesInZone = zone.routes
//             const trafficLightsInZone = zone.trafficLights
//             for (let [buildingType, number] of buildingsInZone.entries()) {
//                 const risk = getRiskOfBuilding(buildingTypes, buildingType);
//                 zone.car += number * risk.car
//                 zone.pedestrian += number * risk.pedestrian
//             }
//             for (let [routeType, number] of routesInZone.entries()) {
//                 const risk = getRiskOfRoute(routeTypes, routeType);

//                 zone.car += number * risk.car
//                 zone.pedestrian += number * risk.pedestrian
//             }
//             zone.car += trafficLightsInZone * TRAFFIC_RISC_CAR
//             zone.pedestrian += trafficLightsInZone * TRAFFIC_RISC_PEDESTRIAN
//               if (zone.car || zone.pedestrian)
//                   console.log("✅ zone id :", zone.zoneId, "car : ", zone.car, "pedestrian :", zone.pedestrian)
//               else
//                   console.log("❌ Zone without Risk ")
              

//         })
//         const minCar: number = zones.reduce((min, current) => {
//             return current.car < min ? current.car : min;
//         }, 0);

//         const maxCar: number = zones.reduce((max, current) => {
//             return current.car > max ? current.car : max;
//         }, 0);

//         const minPed: number = zones.reduce((min, current) => {
//             return current.pedestrian < min ? current.pedestrian : min;
//         }, 0);

//         const maxPed: number = zones.reduce((max, current) => {
//             return current.pedestrian > max ? current.pedestrian : max;
//         }, 0);

//         const ecartCar: number = maxCar - minCar;
//         const ecartPed: number = maxPed - minPed;

        
//         const zoneForApi = zones.map(zone => {


//             return ({

//                 zoneId: zone.zoneId,
//                 type: zone.type,
//                 geometry: zone.geometry,
//                 car: ((zone.car - minCar) * 100 / ecartCar).toFixed(2),
//                 pedestrian: ((zone.pedestrian - minPed) * 100 / ecartPed).toFixed(2),
//                 boundingBox: zone.boundingBox

//             })
//         })


//         res.status(200).json({ success: true , zones });
//     } catch (error) {
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }

// }

// Fonction modifiée pour inclure les mises à jour WebSocket
const getZonesWithRisc = async (req: Request, res: Response) => {
    try {
        let zones = await joinZoneAndTypes(req.body.zones);
        let buildingTypes = await BuildingType.find();
        let routeTypes = await RouteType.find();
        
        zones.forEach(zone => {
            const buildingsInZone = zone.buildings;
            const routesInZone = zone.routes;
            const trafficLightsInZone = zone.trafficLights;

            for (let [buildingType, number] of buildingsInZone.entries()) {
                const risk = getRiskOfBuilding(buildingTypes, buildingType);
                zone.car += number * risk.car;
                zone.pedestrian += number * risk.pedestrian;
            }

            for (let [routeType, number] of routesInZone.entries()) {
                const risk = getRiskOfRoute(routeTypes, routeType);
                zone.car += number * risk.car;
                zone.pedestrian += number * risk.pedestrian;
            }

            zone.car += trafficLightsInZone * TRAFFIC_RISC_CAR;
            zone.pedestrian += trafficLightsInZone * TRAFFIC_RISC_PEDESTRIAN;

            if (zone.car || zone.pedestrian)
                console.log("✅ zone id :", zone.zoneId, "car : ", zone.car, "pedestrian :", zone.pedestrian);
            else
                console.log("❌ Zone without Risk ");
        });

        // Calcul des min/max
        const minCar = zones.reduce((min, current) => Math.min(current.car, min), 0);
        const maxCar = zones.reduce((max, current) => Math.max(current.car, max), 0);
        const minPed = zones.reduce((min, current) => Math.min(current.pedestrian, min), 0);
        const maxPed = zones.reduce((max, current) => Math.max(current.pedestrian, max), 0);

        const ecartCar = maxCar - minCar;
        const ecartPed = maxPed - minPed;

        // Préparation des données pour l'API et WebSocket
        const zoneForApi = zones.map(zone => {
            const normalizedZone = {
                zoneId: zone.zoneId,
                type: zone.type,
                geometry: zone.geometry,
                car: ecartCar !== 0 ? ((zone.car - minCar) * 100 / ecartCar).toFixed(2) : "0.00",
                pedestrian: ecartPed !== 0 ? ((zone.pedestrian - minPed) * 100 / ecartPed).toFixed(2) : "0.00",
                boundingBox: zone.boundingBox
            };

            // Envoyer les mises à jour à tous les clients WebSocket
            const wsData = JSON.stringify({
                type: 'zone_update',
                data: normalizedZone
            });
            
            clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(wsData);
                }
            });

            return normalizedZone;
        });

        // Réponse HTTP
        res.status(200).json({ success: true, zones: zoneForApi });

    } catch (error) {
        // Envoyer l'erreur aux clients WebSocket
        const errorMessage = JSON.stringify({
            type: 'error',
            data: { message: 'Internal server error' }
        });
        
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(errorMessage);
            }
        });

        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export { getZonesWithRisc, organizeDb };

