import { BuildingsTypes, RoutesTypes, ZonesTypes} from '../interfaces/interfaces';
import dotenv  from 'dotenv';
import axios from 'axios';
import { Request, Response } from 'express';

dotenv.config();

const ALADHAN_API = process.env.ALADHAN_API_BASE_URL || '';

function time() {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    let time = hours + minutes / 60;
    return time;
}

export const  ReadFile=(req:Request, res :Response) =>{
    let lien = req.body.lien;
    let fs = require('fs');
    let data = fs.readFileSync(lien, 'utf8');
    res.json(data);

   // return data;
}



export const checkTimeForBuilding=(building: BuildingsTypes):  BuildingsTypes=> {

    switch (building.type) {
        case "school":
        case "university":
            if(time()==8.5 || time()==10.5|| time()==12.5 || time()==14.5 || time()==16.5 || time()==18.5){
                building.pedestrian+=10;
                building.car+=10;
            }
            break;
        case "driver_training":
            if(time()>=9 && time()<=12 || time()>=14 && time()<=18){
                building.pedestrian-=3;
                building.car-=3;
            }
        case "marketplace":
            if(time()>=9 && time()<=22){
                building.pedestrian-=3;
                building.car-=3;
            }
        case "place_of_worship":
            console.log('place of worship');
            building = checkAdhanTime(building);
            break;
        default:
            return building;
    }
    return building;
}

export const checkTimeForZone = (zone: ZonesTypes): ZonesTypes => {
    switch (zone.type) {
        case "beach":
        case "coastline":
            if (time() <= 8 || time() >= 20) {
                zone.pedestrian += 20;
            }
            break;
        case "grassland":
        case "water":
        case "wood":
            if (time() <= 8 || time() >= 20) {
                zone.pedestrian += 40;
            }
            break;
        
        case "cemetery":
            if (time() <= 8 || time() >= 20) {
                zone.pedestrian = 100;
                zone.car += 20;
            }
            break;
        case "basin":
        case "construction":
            if (time() <= 8 || time() >= 20) {
                zone.pedestrian += 3;
            }
            break;
        case "farmland":
        case "forest":
        case "grass":
            if (time() >= 6 && time() <= 18) {
                zone.pedestrian += 2;
            }
            break;
        case "industrial":
        case "railway":
        case "residential":
            console.log(time());
            if (time() >= 6 && time() <= 20) {
                zone.pedestrian -= 10;
            } else {
                zone.pedestrian += 10;
            }
            break;
        case "golf_course":
        case "park":
        case "pitch":
        case "sports_centre":
            if (time() >= 6 || time() <= 18) {
                zone.pedestrian += 15;
            }
            break;
        default:
            return zone;
    }
    return zone;
}

export const checkTimeForRoute = (route: RoutesTypes): RoutesTypes => {
    switch (route.type) {
        case 'construction':
            if (time() <= 6 || time() >= 18) {
                route.pedestrian += 5;
                route.car += 5;
            }
            break;
        case 'footway':
        case 'path':
        case 'pedestrian':
            if (time() <= 6 || time() >= 18) {
                route.pedestrian += 20;
            }
            break;
        case 'living_street':
        case 'residential':
            if (time() <= 6 || time() >= 18) {
                route.pedestrian += 5;
                route.car += 10;
            }
            break;
        case 'motorway':
        case 'motorway_link':
        case 'primary':
        case 'primary_link':
        case 'secondary':
        case 'secondary_link':
        case 'tertiary':
        case 'tertiary_link':
        case 'trunk':
        case 'trunk_link':
        case 'unclassified':
            if (time() <= 6 || time() >= 18) {
                route.car += 15;
            }
            break;
        case 'service':
        case 'steps':
        case 'track':
            if (time() <= 6 || time() >= 18) {
                route.pedestrian += 5;
            }
            break;
        default:
            return route;
    }
    return route;
}

export const checkAdhanTime = (building: BuildingsTypes): BuildingsTypes => {
    const currentTime = time();


    axios.get(ALADHAN_API,{
        params: {
            city: 'Mohammedia',
            country: 'Morocco'
        }
    }).then((response) => {
        const data = (response.data as { data: any }).data;
        const timings = data.timings;
        const prayerTimes = [
            parseFloat(timings.Fajr.replace(':', '.')),
            parseFloat(timings.Dhuhr.replace(':', '.')),
            parseFloat(timings.Asr.replace(':', '.')),
            parseFloat(timings.Maghrib.replace(':', '.')),
            parseFloat(timings.Isha.replace(':', '.'))
        ];

        console.log('Prayer times:', prayerTimes);

        prayerTimes.forEach(prayerTime => {
            if (currentTime >= (prayerTime - 0.0833) || currentTime <= (prayerTime + 0.3333)) {
                building.pedestrian += 10;
                building.car += 10;
            }
        });
    });

    return building;
}
