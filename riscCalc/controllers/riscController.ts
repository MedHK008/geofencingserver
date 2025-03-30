import { Request, Response } from "express";
import { Config, Zone } from "../modules/riscModule";
import { ProcessedZone, Node, BuildingInterface, ConfigInterface, ProcessedBuilding, RouteInterface, ProcessedRoute, ZoneInterface, RiscLevel } from "../interfaces/interfaces";
import { checkTimeForBuilding } from './TimeController';
import { getWeather } from "./weatherRoute";
import { convertZoneSchemaToInterface } from "./SchemasToIntefaces";



const joinBuildingAndRisc = async (config: ConfigInterface, buildings: BuildingInterface[]): Promise<ProcessedBuilding[]> => {
    try {
        return buildings.map(building => {
            const ourConfig = config.buildings.find(b => b.type === building.type);
            return {
                ...building,
                pedestrian: ourConfig?.riscP || RiscLevel.NONE,
                car: ourConfig?.riscC || RiscLevel.NONE,
            };
        });
    } catch (error) {
        console.error("Error joining buildings and risks:", error);
        throw error;
    }
};

const joinRouteAndRisc = async (config: ConfigInterface, routes: RouteInterface[]): Promise<ProcessedRoute[]> => {
    try {

        return routes.map(route => {

            const ourConfig = config.routes.find(r => r.type === route.type);


            return {
                ...route,
                pedestrian: ourConfig?.riscP || RiscLevel.NONE,
                car: ourConfig?.riscC || RiscLevel.NONE,
            };
        });
    } catch (error) {
        console.error("Error joining routes and risks:", error);
        throw error;
    }
};

const joinZoneAndRisc = async (config: ConfigInterface, zones: ZoneInterface[]): Promise<ProcessedZone[]> => {
    try {
        return zones.map(zone => {
            const ourConfig = config.zones.find(z => z.type === zone.type);
            let car = { none: 0, faible: 0, moyenne: 0, eleve: 0 }
            let pedestrian = { none: 0, faible: 0, moyenne: 0, eleve: 0 }

            if (ourConfig?.riscC === RiscLevel.NONE) car.none++;
            else if (ourConfig?.riscC === RiscLevel.FAIBLE) car.faible++;
            else if (ourConfig?.riscC === RiscLevel.MOYENNE) car.moyenne++;
            else if (ourConfig?.riscC === RiscLevel.ELEVE) car.eleve++;

            if (ourConfig?.riscP === RiscLevel.NONE) pedestrian.none++;
            else if (ourConfig?.riscP === RiscLevel.FAIBLE) pedestrian.faible++;
            else if (ourConfig?.riscP === RiscLevel.MOYENNE) pedestrian.moyenne++;
            else if (ourConfig?.riscP === RiscLevel.ELEVE) pedestrian.eleve++;

            return {
                ...zone,
                riscP: 0,
                riscC: 0,
                car: car,
                pedestrian: pedestrian,

            };
        });
    } catch (error) {
        console.error("Error joining zones and risks:", error);
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

const getZonesWithRisc = async (req: Request, res: Response) => {
    const start = Date.now();
    try {

        let zones: ZoneInterface[] = req.body.zones
        const config: ConfigInterface[] = await Config.find().lean();
        const newZones = await Promise.all(
            zones.map(async (zone) => {
                return await Zone.findOne({ zoneId: zone.zoneId })
                    .populate('buildings')
                    .populate('routes')
                    .lean();
            })
        );
        let anotherZ: ZoneInterface[] = newZones.map(z => {
            return convertZoneSchemaToInterface(z)
        })

        let anotherzones: ProcessedZone[] = await joinZoneAndRisc(config[0], anotherZ)
        anotherzones = await Promise.all(anotherzones.map(async (zone) => {


            zone.buildings = await joinBuildingAndRisc(config[0], zone.buildings)
            zone.routes = await joinRouteAndRisc(config[0], zone.routes)
            zone.buildings = await Promise.all(
                zone.buildings.map(async (building) => {
                    return checkTimeForBuilding(building);
                })
            );


            zone.buildings.forEach(building => {
                if (building.car === RiscLevel.NONE) zone.car.none++;
                if (building.car === RiscLevel.FAIBLE) zone.car.faible++;
                if (building.car === RiscLevel.MOYENNE) zone.car.moyenne++;
                if (building.car === RiscLevel.ELEVE) zone.car.eleve++;

                if (building.pedestrian === RiscLevel.NONE) zone.pedestrian.none++;
                if (building.pedestrian === RiscLevel.FAIBLE) zone.pedestrian.faible++;
                if (building.pedestrian === RiscLevel.MOYENNE) zone.pedestrian.moyenne++;
                if (building.pedestrian === RiscLevel.ELEVE) zone.pedestrian.eleve++;
            });

            zone.routes.forEach(route => {
                if (route.car === RiscLevel.NONE) zone.car.none++;
                if (route.car === RiscLevel.FAIBLE) zone.car.faible++;
                if (route.car === RiscLevel.MOYENNE) zone.car.moyenne++;
                if (route.car === RiscLevel.ELEVE) zone.car.eleve++;

                if (route.pedestrian === RiscLevel.NONE) zone.pedestrian.none++;
                if (route.pedestrian === RiscLevel.FAIBLE) zone.pedestrian.faible++;
                if (route.pedestrian === RiscLevel.MOYENNE) zone.pedestrian.moyenne++;
                if (route.pedestrian === RiscLevel.ELEVE) zone.pedestrian.eleve++;
            });



            // const state = await getWeather();
            // if (state === RiscLevel.NONE) zone.car.none++;
            // if (state === RiscLevel.FAIBLE) zone.car.faible++;
            // if (state === RiscLevel.MOYENNE) zone.car.moyenne++;
            // if (state === RiscLevel.ELEVE) zone.car.eleve++;


            zone.riscC = parseFloat((
                (zone.car.faible * 0.15 + zone.car.moyenne * 0.35 + zone.car.eleve * 0.5) /
                (zone.car.faible + zone.car.moyenne + zone.car.eleve)
            ).toFixed(2));
            
            zone.riscP = parseFloat((
                (zone.pedestrian.faible * 0.15 + zone.pedestrian.moyenne * 0.35 + zone.pedestrian.eleve * 0.5) /
                (zone.pedestrian.faible + zone.pedestrian.moyenne + zone.pedestrian.eleve)
            ).toFixed(2));
            return zone;
        }));
        const end = Date.now() - start;
        res.status(200).json({ success: true, anotherzones, end });
    } catch (error) {
        console.error("Error processing zones:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



export { getZonesWithRisc };

