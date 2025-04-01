import { Accident } from "../modules/accidentModule";

export interface ProcessedZone {
    zoneID: string;
    accidents: number | string
}

export interface Accident_city {
    city : string 
    accidents : number
}
