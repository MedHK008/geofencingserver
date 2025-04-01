export enum RiscLevel {
    NONE = "none",
    FAIBLE = "faible",
    MOYENNE = "moyenne",
    ELEVE = "élevé"
}
export interface RouteInterface {
    id: number;
    type: string;
    nodes: Node[];
    name: string,
    speed: number,
    accident: number,

}
export interface ProcessedRoute {
    id: number;
    type: string;
    nodes: Node[];
    name: string,
    speed: number,
    accident: number,
    pedestrian: RiscLevel;
    car: RiscLevel;

}
export interface ZoneInterface {
    zoneId: string;
    geometry: { lat: number; lon: number }[];
    bounding_box: { lat: number; lon: number }[];
    type: string;
    routes: ProcessedRoute[];
    trafficLights: number;
    buildings: ProcessedBuilding[];
}

export interface ProcessedZone {
    zoneId: string;
    geometry: { lat: number; lon: number }[];
    bounding_box: { lat: number; lon: number }[];
    type: string;
    routes: ProcessedRoute[];
    trafficLights: number;
    buildings: ProcessedBuilding[];
    riscC: number,
    riscP: number,
    pedestrian: {
        none: number;
        faible: number;
        moyenne: number;
        eleve: number;
    };

    car: {
        none: number;
        faible: number;
        moyenne: number;
        eleve: number;
    };
}





export interface Node {
    lat: number;
    lon: number;
}

export interface BuildingInterface {
    id: number;
    type: string;
    name: string;
    unactif_mouth: number[];
    unactif_days: string[];
    activity_hours: {
        begin: number;
        end: number;
    }[];
}
export interface ProcessedBuilding {
    id: number;
    type: string;
    name: string;
    unactif_mouth: number[];
    unactif_days: string[];
    activity_hours: {
        begin: number;
        end: number;
    }[];
    pedestrian: RiscLevel;
    car: RiscLevel;
}
export interface BuildingsConfig {
    type: string;
    pedestrian: RiscLevel;
    car: RiscLevel;
}

export interface RoutesConfig {
    type: string;
    pedestrian: RiscLevel;
    car: RiscLevel;
}

export interface ZonesConfig {
    type: string;
    pedestrian: RiscLevel;
    car: RiscLevel;
}
export interface ConfigInterface {
    zones: [{
        type: String,
        riscP: RiscLevel,
        riscC: RiscLevel,
    }],
    buildings: [{

        type: String,
        riscP: RiscLevel,
        riscC: RiscLevel,
    }],
    routes: [{

        type: String,
        riscP: RiscLevel,
        riscC: RiscLevel,

    }],
    building_mappings: [{
        original_type: String,
        mapped_type: String
    }],
    route_mappings: [{
        original_type: String,
        mapped_type: String
    }],
    zone_mappings: [{
        original_type: String,
        mapped_type: String
    }],
    processed_bboxes: [{
        name: String,
        min_lat: Number,
        max_lat: Number,
        min_lon: Number,
        max_lon: Number
    }]
}
