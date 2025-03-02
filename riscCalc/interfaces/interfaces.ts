export interface ProcessedRoute {
    id: number;
    type: string;
    nodes: Node[];
}

export interface ProcessedZone {
    id: number;
    type: string;
    nodes: Node[];
}

export interface Node {
    lat: number;
    lon: number;
}