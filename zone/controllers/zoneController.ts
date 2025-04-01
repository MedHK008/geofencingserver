import { zoneModule } from "../modules/zoneModule";


interface ProcessedZone {
    zoneId: string;
    type: string;
    geometry: { lat: number; lon: number }[];
    bounding_box: {
        minLat: number,
        maxLat: number,
        minLon: number,
        maxLon: number
    };
    buildings?: string[];
    routes?: string[];
    cross_walks?: number;
}

const zoneToProcessedZone = (zones: any[]): ProcessedZone[] => {
    return zones.map((zone): ProcessedZone => {
        // Correction de la typo 'boundings_box' -> 'bounding_box'
        const bbox = zone.bounding_box || [];
        
        return {
            zoneId: zone.zoneId?.toString() || "none",
            type: zone.tags?.landuse || 'unknown',
            geometry: zone.geometry || [],
            bounding_box: {
                minLat: bbox[0]?.lat || 0,
                maxLat: bbox[1]?.lat || 0,
                minLon: bbox[0]?.lon || 0,
                maxLon: bbox[1]?.lon || 0
            },
            cross_walks: zone.cross_walks || 0,
            routes: zone.routes || [],
            buildings: zone.buildings || []
        };
    });
};

export const getZones = async (req: any, res: any) => {
    try {
        const data = await zoneModule.find({});
        
        if (!data || data.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No zones found" 
            });
        }

        const processedZones = zoneToProcessedZone(data);
        
        res.status(200).json({ 
            success: true, 
            count: processedZones.length,
            processedZones 
        });

    } catch (error) {
        console.error("Error fetching zones:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};