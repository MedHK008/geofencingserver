import axios from "axios";
import { Request, Response } from "express";

interface WeatherData {
    wind: {
        speed: number;
    };
    rain?: {
        "1h"?: number;
    };
    snow?: {
        "1h"?: number;
    };
}

const getWeather = async (req: Request, res: Response) => {
    try {
        const url = process.env.WEATHER_API_LINK;
        const key = process.env.API_KEY_FOR_WEATHER;
        const fullUrl = `${url}Mohammedia,MA&appid=${key}&units=metric`;
        const response = await axios.get(fullUrl);
        const weatherState = response.data as WeatherData;
        
        res.status(200).json({
            windSpeed: weatherState.wind.speed,
            precipitation: {
                rain :weatherState.rain?.["1h"] || 0 ,
                snow :weatherState.snow?.["1h"] || 0
            }
        });



    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
};
export { getWeather }