import { zoneModule } from "../modules/zoneModule"
import { Request, Response } from "express";
interface ProcessedZone {
    zoneId: string;
    type: string;
    geometry?: Array<{ lat: number; lon: number }>; // Add geometry to response
}
const zoneToProcessedZone = (zones: any[]): ProcessedZone[] => {
    const processedZones: ProcessedZone[] = zones.map((zone): ProcessedZone => {
        return {
            zoneId: zone.zoneId,
            type: zone.tags.landuse,
            geometry: zone.geometry
        };
    });
    return processedZones;
}
export const getZones = async (req: Request, res: Response) => {
    try {
        const data = await zoneModule.find({});
        const processedZones = zoneToProcessedZone(data);
        res.status(200).json({ success: true, processedZones })
    } catch (error) {
        res.status(500).json({ success: false });
    }

}




