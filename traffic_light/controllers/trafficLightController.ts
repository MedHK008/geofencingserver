import { Request, Response } from "express";
import { trafficLightModule } from "../modules/trafficLightModule";



const getTrafficLight = async (req: Request, res: Response) => {
    try {
        const data = await trafficLightModule.find({});
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false });
    }

}

export { getTrafficLight }