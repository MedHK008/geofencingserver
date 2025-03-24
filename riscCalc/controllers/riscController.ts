import { Request, Response } from "express";
import { Config, Zone } from "../modules/riscModule";
import { ProcessedZone, Node, BuildingInterface, ConfigInterface, ProcessedBuilding, RouteInterface, ProcessedRoute, ZoneInterface, RiscLevel } from "../interfaces/interfaces";
import { checkTimeForBuilding } from './TimeController';
import { getWeather } from "./weatherRoute";

const joinBuildingAndRisc = async (config: ConfigInterface, buildings: BuildingInterface[]): Promise<ProcessedBuilding[]> => {
    try {
        return buildings.map(building => {
            console.log(building)
            const ourConfig = config.buildings.find(b => b.type === building.type);
            // console.log(ourConfig)
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
            console.log(ourConfig)
            return {
                ...zone,
                riscP: ourConfig?.riscP || RiscLevel.NONE,
                riscC: ourConfig?.riscC || RiscLevel.NONE,
                car: { none: 0, faible: 0, moyenne: 0, eleve: 0 },
                pedestrian: { none: 0, faible: 0, moyenne: 0, eleve: 0 },

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
        console.log(newZones[0].routes);
        let anotherzones: ProcessedZone[] = await joinZoneAndRisc(config[0], newZones)
        anotherzones = await Promise.all(anotherzones.map(async (zone) => {
            zone.car = { none: 0, faible: 0, moyenne: 0, eleve: 0 };
            zone.pedestrian = { none: 0, faible: 0, moyenne: 0, eleve: 0 };

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


            const state = await getWeather();
            if (state === RiscLevel.NONE) zone.car.none++;
            if (state === RiscLevel.FAIBLE) zone.car.faible++;
            if (state === RiscLevel.MOYENNE) zone.car.moyenne++;
            if (state === RiscLevel.ELEVE) zone.car.eleve++;


            const riscC = zone.car.faible * 0.15 + zone.car.moyenne * 0.35 + zone.car.eleve * 0.5
            const riscP = zone.pedestrian.faible * 0.15 + zone.pedestrian.moyenne * 0.35 + zone.pedestrian.eleve * 0.5

            if (riscC > 0 && riscC <= 0.15) zone.riscC = RiscLevel.NONE
            else if (riscC > 0.15 && riscC <= 0.35) zone.riscC = RiscLevel.FAIBLE
            else if (riscC > 0.35 && riscC <= 0.75) zone.riscC = RiscLevel.MOYENNE
            else if (riscC > 0.75 && riscC <= 1) zone.riscC = RiscLevel.ELEVE

            if (riscP > 0 && riscP <= 0.15) zone.riscP = RiscLevel.NONE
            else if (riscP > 0.15 && riscP <= 0.35) zone.riscP = RiscLevel.FAIBLE
            else if (riscP > 0.35 && riscP <= 0.75) zone.riscP = RiscLevel.MOYENNE
            else if (riscP > 0.75 && riscP <= 1) zone.riscP = RiscLevel.ELEVE


            // console.log(`
            //     📍 Zone ID: ${zone.zoneId}
            //     ----------------------------------------
            //     🚧 Risque Collision (riscC): ${riscC.toFixed(2)}
            //        ➡️ Niveau: ${zone.riscC} ${zone.riscC === RiscLevel.NONE ? "✅ (Aucun)" :
            //         zone.riscC === RiscLevel.FAIBLE ? "🟢 (Faible)" :
            //             zone.riscC === RiscLevel.MOYENNE ? "🟠 (Moyen)" :
            //                 zone.riscC === RiscLevel.ELEVE ? "🔴 (Élevé)" : ""}
                
            //     🚶‍♂️ Risque Piétons (riscP): ${riscP.toFixed(2)}
            //        ➡️ Niveau: ${zone.riscP} ${zone.riscP === RiscLevel.NONE ? "✅ (Aucun)" :
            //         zone.riscP === RiscLevel.FAIBLE ? "🟢 (Faible)" :
            //             zone.riscP === RiscLevel.MOYENNE ? "🟠 (Moyen)" :
            //                 zone.riscP === RiscLevel.ELEVE ? "🔴 (Élevé)" : ""}
            //     ----------------------------------------
            //     `);
            return zone;
        }));



        // console.log(anotherzones)
        const end = Date.now() - start;
        // console.log(`Execution time: ${end}ms`);

        res.status(200).json({ success: true, anotherzones, end });
    } catch (error) {
        console.error("Error processing zones:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};



export { getZonesWithRisc };

