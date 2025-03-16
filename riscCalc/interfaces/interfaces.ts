export interface ProcessedRoute {
    id: number;
    type: string;
    nodes: Node[];
}

export interface ProcessedZone {
    zoneId: string;
    geometry: { 0: number; 1: number }[];
    type: string;
    routes: Map<string, number>;
    trafficLights: number;
    buildings: Map<string, number>;

}

export interface Node {
    lat: number;
    lon: number;
}

export interface Building {
    id: number;
    type: string;
    nodes: Node[];
}

export interface BuildingsTypes {
    type: string;
    pedestrian: number;
    car: number;
}

export interface RoutesTypes {
    type: string;
    pedestrian: number;
    car: number;
}

export interface ZonesTypes {
    type: string;
    pedestrian: number;
    car: number;
}