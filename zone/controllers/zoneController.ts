import { zoneModule } from "../modules/zoneModule"
import { Request, Response } from "express";
interface ProcessedZone {
    id: string;
    type: string;

    geometry?: Array<{ lat: number; lon: number }>; // Add geometry to response
}
const zoneToProcessedZone = (zones: any[]): ProcessedZone[] => {
    const processedZones: ProcessedZone[] = zones.map((zone): ProcessedZone => {
        return {
            id: zone.id,
            type: zone.tags.landuse || zone.tags.leisure || zone.tags.natural || 'unknown',
            geometry: zone.geometry // Include geometry in the response
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




