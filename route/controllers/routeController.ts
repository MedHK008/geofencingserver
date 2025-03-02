import { Request, Response } from "express";
import { routeModule } from "../modules/routeModule";

interface ProcessedRoute {
    id: number;
    type: string;
    name: string;
    nodes: Node[];
}

interface Node {
    lat: number;
    lon: number;
}
const routeFromProcessesRoutes = (routes: any[]): ProcessedRoute[] => {
    const processedRoutes = routes.map((route): ProcessedRoute => {
        const { nodes, tags, name } = route;

        const validNodes = Array.isArray(nodes) ? nodes : [];

        return {
            id: route.id || 0, // Provide fallback for missing id
            type: tags?.highway || 'unknown', // Fallback for missing type
            name: name || 'Unnamed', // Fallback for missing name
            nodes: validNodes, // Ensure valid nodes
        };
    });
    return processedRoutes;
}

const getRouteLight = async (req: Request, res: Response) => {
    try {
        const data = await routeModule.find({});
        const processedRoutes = routeFromProcessesRoutes(data);


        res.status(200).json({ success: true, processedRoutes });
    } catch (error) {
        console.error("Error fetching routes:", error); // Log the error for debugging
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export { getRouteLight };
