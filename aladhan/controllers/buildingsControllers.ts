import { Request, Response } from "express";
import { buildingModule } from "../modules/buildingsModules";


const getBuildings = async (req: Request, res: Response) => {

    try {
        const data = await buildingModule.find({});
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false });
    }

}
export { getBuildings }