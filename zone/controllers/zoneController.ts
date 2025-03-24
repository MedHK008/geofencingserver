import { zoneModule } from "../modules/zoneModule"
import { Request, Response } from "express";
interface ProcessedZone {
    zoneId: string;
    type: string;
    geometry: { lat: number; lon: number }[];
    bounding_box?: {
        minLat:number,
        maxLat:number,
        minLon:number,
        maxLon:number};
    buildings?:string[],
    routes?:string[],
    cross_walks?:number 
    car?: number
    pedestrian?: number
}
const zoneToProcessedZone = (zones: any[]): ProcessedZone[] => {
    const processedZones: ProcessedZone[] = zones.map((zone): ProcessedZone => {
        return {
            zoneId: zone._id || "none",
            type: zone.tags.landuse || zone.tags.leisure || zone.tags.natural || 'unknown',
            geometry: zone.geometry,
            //bounding_box: {minLat : zone.bounds.minLat , maxLat : zone.bounds.maxLat , minLon : zone.bounds.minLon , maxLon : zone.bounds.maxLon},
            cross_walks: zone.cross_walks || undefined,
            routes: zone.routes,
            buildings: zone.buildings
    
        };

    });

    return processedZones;
}
export const getZones = async (req: Request, res: Response) => {
    try {
        const data = await zoneModule.find({});
        const processedZones = zoneToProcessedZone(data);
        console.log(processedZones[0]);
        res.status(200).json({ success: true, processedZones })

    } catch (error) {
        res.status(500).json({ success: false , error: error });
    }
}




