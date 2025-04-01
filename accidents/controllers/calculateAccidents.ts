import { Accident, Zone, Route } from "../modules/accidentModule";
import { ProcessedZone } from "../interfaces/interfaces";
import { Request, Response } from "express";

export const calculateAccidents = async (city: string = "Mohammedia"): Promise<ProcessedZone[]> => {
    try {
        const accidents = await Accident.find({ city });
        const zonesResponse = await fetch("http://localhost:8081/api/zones");
        const routesResponse = await fetch("http://localhost:8084/api/routes");

        if (!zonesResponse.ok || !routesResponse.ok) {
            throw new Error("Failed to fetch zones or routes from APIs.");
        }

        const zones = await zonesResponse.json();
        const routes = await routesResponse.json();

        if (!routes || routes.length === 0) {
            throw new Error("No routes found in the database.");
        }

        if (!accidents || accidents.length === 0) {
            return zones.map((zone: { zoneId: any; }) => ({
                zoneID: zone.zoneId,
                accidents: 0,
            }));
        }

        const totalAccidents = accidents.reduce((sum, accident) => sum + accident.accidents, 0);
        const accidentsPerRoute = Math.round(totalAccidents / routes.length);

        const processedZones: ProcessedZone[] = zones.map((zone: { routes: string | any[]; zoneId: any; }) => {
            const routeCount = Array.isArray(zone.routes) ? zone.routes.length : 0;
            const zoneAccidents = routeCount * accidentsPerRoute;

            return {
                zoneID: zone.zoneId,
                accidents: zoneAccidents,
            };
        });

        return processedZones;
    } catch (error) {
        throw error;
    }
};


export const getZonesWithAccidents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { city } = req.params;

        if (!city || typeof city !== "string" || city.trim().length === 0) {
            res.status(400).json({
                message: "City parameter is required and must be a non-empty string.",
            });
            return;
        }

        const trimmedCity = city.trim();

        const zonesWithAccidents = await calculateAccidents(trimmedCity);

        res.status(200).json(zonesWithAccidents);
    } catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "An unknown error occurred",
        });
    }
};