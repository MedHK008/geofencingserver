import { BuildingsConfig, ProcessedBuilding, ProcessedZone, RiscLevel, RoutesConfig, ZonesConfig } from '../interfaces/interfaces';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const ALADHAN_API = process.env.ALADHAN_API_BASE_URL || '';

function time() {
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    let time = hours + minutes / 60;
    return time;
}
export const checkAdhanTime = async (building: ProcessedBuilding): Promise<ProcessedBuilding> => {
    const currentTime = time();

    try {
        const response = await axios.get(ALADHAN_API, {
            params: {
                city: 'Mohammedia',
                country: 'Morocco'
            }
        });

        const data = (response.data as { data: any }).data;
        const timings = data.timings;
        const prayerTimes = [
            parseFloat(timings.Fajr.replace(':', '.')),
            parseFloat(timings.Dhuhr.replace(':', '.')),
            parseFloat(timings.Asr.replace(':', '.')),
            parseFloat(timings.Maghrib.replace(':', '.')),
            parseFloat(timings.Isha.replace(':', '.'))
        ];


        prayerTimes.forEach(prayerTime => {
            if (currentTime >= (prayerTime - 0.0833) || currentTime <= (prayerTime + 0.3333)) {
                building.car = RiscLevel.FAIBLE;
            }
        });
    } catch (error) {
        console.error('Error fetching prayer times:', error);
    }

    return building;
};



export const checkTimeForBuilding = async (building: ProcessedBuilding): Promise<ProcessedBuilding> => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const month = today.getMonth() + 1;
    const currentHour = today.getHours();
    if (building.type === "place_of_worship") {
        return checkAdhanTime(building);
    }
    if (building.unactif_mouth.includes(month) || building.unactif_days.includes(formattedDate)) {
        return building;
    }
    let isRisc = false;
    if (building.activity_hours.length > 0) {
        isRisc = building.activity_hours.some(hourRange =>
            currentHour >= hourRange.begin && currentHour <= hourRange.end
        );

        if (!isRisc) return building;

        switch (building.type) {
            case "school":
                building.car = RiscLevel.MOYENNE;
                break;
            case "university":
                building.car = RiscLevel.FAIBLE;
                break;
            case "driver_training":
                building.pedestrian = RiscLevel.FAIBLE;
                building.car = RiscLevel.MOYENNE;
                break;
            case "taxi":
                building.car = RiscLevel.MOYENNE;
                building.pedestrian = RiscLevel.FAIBLE;
                break;
            case "hospital":
                building.car = RiscLevel.MOYENNE
                break;
            case "marketplace":
                building.car = RiscLevel.MOYENNE;
                break;
            default:
                console.warn(`Unknown building type: ${building.type}`);
                break;
        }

        return building;
    }

    return building;
};



