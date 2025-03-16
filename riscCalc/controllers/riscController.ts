import { Request, Response } from "express";
import { Building, BuildingType, Route, RouteType, Zone, ZoneType, TrafficLight } from "../modules/riscModule";
import { TRAFFIC_RISC_CAR, TRAFFIC_RISC_PEDESTRIAN } from "../config/constants";
import { ProcessedZone, Node, BuildingsTypes, RoutesTypes } from "../interfaces/interfaces";
import { ProcessedRoute } from "../src";
import { checkTimeForRoute, checkTimeForBuilding, checkAdhanTime, checkTimeForZone } from './TimeController';
import mongoose from "mongoose";

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
            zoneId: zone.id,
            geometry: zone.geometry || [],
            type: zone.tags.landuse || zone.tags.leisure || zone.tags.natural || 'unknown',
            routes: new Map(Object.entries(zone.routes || {})),
            trafficLights: zone.trafficLights || 0,
            buildings: new Map(Object.entries(zone.buildings || {})),

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

const joinZoneAndTypes = async () => {
    try {

        const allZones = await Zone.find();
        const zones = zoneFromProcessedZones(allZones);
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
        // Avoid division by zero
        if (yj === yi) continue;

        // Check if the point is exactly on a polygon edge
        if ((y === yi && x === xi) || (y === yj && x === xj)) {
            console.log("Point is on the boundary");
            return true; // Consider the point inside if it is on the boundary
        }

        // Ray-casting algorithm
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}
const formatGeometry = (geometry: any[]): { lat: number, lon: number }[] => {
    return geometry.map(coord => {
        const newCoord = coord.toObject();
        return {
            lat: newCoord['1'],
            lon: newCoord['0']
        };
    });
};


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
            const standardNode = formatGeometry(zone.geometry);


            // Filter Buildings - Utiliser le type de bâtiment comme clé et compter les occurrences
            buildings = buildings.filter(building => {
                if (isPointInZone({ lat: building.lat, lon: building.lon }, standardNode)) {
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
                route.nodes = route.nodes.filter((node: Node) => !isPointInZone(node, standardNode));



                if (route.nodes.length < originalNodeCount) {
                    const type = route.tags.highway;
                    routeMap.set(type, (routeMap.get(type) || 0) + 1); // Incrémenter le compteur pour ce type
                }
                return route;
            }).filter(route => route.nodes.length > 0);

            // Filter Traffic Lights - Utiliser le nom du feu de circulation comme clé et compter les occurrences
            trafficLights = trafficLights.filter(trafficLight => {
                if (isPointInZone({ lat: trafficLight.lat, lon: trafficLight.lon }, standardNode)) {
                    console.log(trafficLightnumber)

                    trafficLightnumber++;
                    return false;
                }
                return true;
            });

            // Vérifier si des valeurs existent avant la mise à jour
            console.log(zone._id, buildingMap, routeMap, trafficLightnumber);
            if (buildingMap.size > 0 || routeMap.size > 0 || trafficLightnumber > 0) {
                try {
                    const result = await Zone.updateOne(
                        { _id: zone._id },
                        {
                            $set: {
                                buildings: Object.fromEntries(buildingMap), // Convertir le Map en objet clé-valeur pour buildings
                                routes: Object.fromEntries(routeMap), // Convertir le Map en objet clé-valeur pour routes
                                trafficLights: trafficLightnumber // Mettre à jour le nombre de feux de circulation
                            }
                        }

                    );

                    console.log(`🔍 Documents modifiés: ${result.modifiedCount}`);
                    console.log(`✅ Mise à jour de la zone ${zone.zoneId} réussie !`);
                } catch (error) {
                    console.error(`❌ Erreur lors de la mise à jour de la zone ${zone.zoneId}:`, error);
                }
            } else {
                console.log(`⚠️ Aucun changement pour la zone ${zone.zoneId}`);
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

    // let processedRoutes = await joinRouteAndTypes();
    console.log("je suis dns joiture des zones apres les routes")
    let processedZones = await joinZoneAndTypes();
    console.log("je suis dns joiture des zones apres les zones")
    let trafficLights = await joinTrafficLight();
    console.log("je suis dns joiture des zones apes les trafic")
    return processedZones.map(zone => {
        return {
            ...zone,
            //buildings: buildings.filter(building => zone.Buildings.includes(building._id)),
            //routes: processedRoutes.filter(route => zone.Routes.includes(route._id)),
            //trafficLights: trafficLights.filter(light => zone.TrafficLights.includes(light._id))
        };
    });
};



export const ProcessedZonesWithRisc = async () => {
    /*let buildings = await joinBuildingAndTypes();
    let processedRoutes = await joinRouteAndTypes();
    let processedZones = await joinZoneAndTypes();
    let trafficLights = await joinTrafficLight();
    let Zones = await joinZoneAndComponents();
    console.log("je suis dns joiture des zones apres le jointure")
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

            /* zone.routes.forEach(route => {
                zone.pedestrian += route.pedestrian;
                zone.car += route.car;
               // processedRoutes = processedRoutes.filter(r => r.id !== route.id);
            });

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
*/
};
/*
const getZonesWithRisc = async (req: Request, res: Response) => {
    try {
        console.log("je suis dans getZonesWithRisc");
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
*/
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

const getZonesWithRisc = async (req: Request, res: Response) => {
    const start = Date.now();
    try {
        let zones = await joinZoneAndTypes()
        let buildingTypes = await BuildingType.find()
        let routeTypes = await RouteType.find()

        zones.forEach(zone => {


            const buildingsInZone = zone.buildings
            const routesInZone = zone.routes
            const trafficLightsInZone = zone.trafficLights
            for (let [buildingType, number] of buildingsInZone.entries()) {
                const risk = getRiskOfBuilding(buildingTypes, buildingType);
                zone.car += number * risk.car
                zone.pedestrian += number * risk.pedestrian
            }
            for (let [routeType, number] of routesInZone.entries()) {
                const risk = getRiskOfRoute(routeTypes, routeType);

                zone.car += number * risk.car
                zone.pedestrian += number * risk.pedestrian
            }
            zone.car += trafficLightsInZone * TRAFFIC_RISC_CAR
            zone.pedestrian += trafficLightsInZone * TRAFFIC_RISC_PEDESTRIAN



        })
        const minCar: number = zones.reduce((min, current) => {
            return current.car < min ? current.car : min;
        }, 0);

        const maxCar: number = zones.reduce((max, current) => {
            return current.car > max ? current.car : max;
        }, 0);

        const minPed: number = zones.reduce((min, current) => {
            return current.pedestrian < min ? current.pedestrian : min;
        }, 0);

        const maxPed: number = zones.reduce((max, current) => {
            return current.pedestrian > max ? current.pedestrian : max;
        }, 0);

        const ecartCar: number = maxCar - minCar;
        const ecartPed: number = maxPed - minPed;

        zones.forEach(zone => {
            zone.car = (zone.car - minCar) / ecartCar;
            zone.pedestrian = (zone.pedestrian - minPed) / ecartPed;
            if (zone.car || zone.pedestrian)
                console.log("✅ zone id :", zone.zoneId, "car : ", zone.car, "pedestrian :", zone.pedestrian)
            else
                console.log("❌ Zone without Risk ")

        })



        const end = Date.now() - start;
        console.log(`Execution time: ${end}ms`);

        res.status(200).json({ success: true, zones, end });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }

}
    

export { getZonesWithRisc, organizeDb };

