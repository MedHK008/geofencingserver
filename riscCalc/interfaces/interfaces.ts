import mongoose from "mongoose";

export interface ProcessedRoute {
    _id: mongoose.Schema.Types.ObjectId;
    id: number;
    type: string;
    nodes: Node[];
}

export interface ProcessedZone {
    id: number;
    type: string;
    nodes: Node[];
    Buildings: mongoose.Schema.Types.ObjectId[];
    Routes:mongoose.Schema.Types.ObjectId[];
    TrafficLights: mongoose.Schema.Types.ObjectId[];
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