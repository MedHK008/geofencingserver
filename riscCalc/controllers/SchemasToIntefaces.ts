import { BuildingInterface, RouteInterface, ZoneInterface } from "../interfaces/interfaces";


// Convertir un BuildingSchema en BuildingInterface
const convertBuildingSchemaToInterface = (building: any): BuildingInterface => {
    return {
        id: building.id,
        type: building.type,
        name: building.name,
        unactif_mouth: building.unactif_mouth,
        unactif_days: building.unactif_days.map((date: any) => {
            // Si c'est déjà une Date valide
            if (date instanceof Date && !isNaN(date.getTime())) {
                return date.toISOString().split("T")[0];
            }
            // Si c'est une chaîne ou autre chose, essayer de la convertir
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split("T")[0];
            }
            // Si la date est invalide, retourner une valeur par défaut ou lever une erreur
            console.warn(`Date invalide détectée : ${date}`);
            return null; // Ou une autre valeur par défaut, selon tes besoins
        }).filter((d: string | null) => d !== null), // Filtrer les valeurs null si nécessaire
        activity_hours: building.activity_hours.map((time: number[]) => ({ begin: time[0], end: time[1] }))
    };
};
// Convertir un RouteSchema en RouteInterface
const convertRouteSchemaToInterface = (route: any): RouteInterface => {
    return {
        id: route.id,
        type: route.tags.highway,
        nodes: route.nodes.map((node: any) => ({ lat: node.lat, lon: node.lon })),
        name: route.tags.name,
        speed: route.tags.speed,
        accident: route.tags.accident
    };
};

// Convertir un ZoneSchema en ZoneInterface
const convertZoneSchemaToInterface = (zone: any): ZoneInterface => {
    return {
        zoneId: zone.zoneId,
        geometry: zone.geometry.map((point: any) => ({ lat: point.lat, lon: point.lon })),
        bounding_box: zone.bounding_box.map((point: any) => ({ lat: point.lat, lon: point.lon })),
        type: zone.tags?.landuse || "unknown",
        routes: zone.routes.map((route: any) => convertRouteSchemaToInterface(route)),
        trafficLights: zone.cross_walks,
        buildings: zone.buildings.map((building: any) => convertBuildingSchemaToInterface(building))
    };
};

export { convertBuildingSchemaToInterface, convertRouteSchemaToInterface, convertZoneSchemaToInterface };
