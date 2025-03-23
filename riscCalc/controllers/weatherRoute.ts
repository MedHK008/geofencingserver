import axios from "axios";
import { RiscLevel } from "../interfaces/interfaces";
import { Request, Response } from "express";
import { stat } from "fs";

interface WeatherResponse {
    weather: { main: string; description: string }[];
    main: { temp: number };
    name: string;
}

const getWeather = async () => {
    try {
        const url = process.env.WEATHER_API_LINK;
        const key = process.env.API_KEY_FOR_WEATHER;
        const fullUrl = `${url}Mohammedia,MA&appid=${key}&units=metric`;
        const response = await axios.get<WeatherResponse>(fullUrl); // Correctly destructuring here
        const weatherState = response.data.weather[0].main.toLowerCase();
        console.log(`Weather in Mohammedia: ${weatherState} `);
        if (weatherState === "clear" || weatherState === "clouds") return RiscLevel.NONE;
        if (weatherState === "rain" || weatherState === "mist" || weatherState === "dust") return RiscLevel.FAIBLE;
        if (weatherState === "thunderstorm " || weatherState === "haze " || weatherState === "dust" || weatherState === "squall") return RiscLevel.MOYENNE


        return RiscLevel.ELEVE

    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
};
const getWeatherApi = async (req: Request, res: Response) => {

    try {
        const state = await getWeather()
        res.status(200).json({ state })
    } catch (error) {
        res.status(500)
    }

}

export { getWeather, getWeatherApi }
