import mongoose from "mongoose";
const routeSchema = new mongoose.Schema(

    {
        id: { type: Number, required: true },
        nodes: {
            type: [
                {
                    lat: { type: Number, required: true },
                    lon: { type: Number, required: true },
                }
            ],
            required: true
        },
        tags: {

            addr: {
                street: { type: String, required: true }
            },
            highway: { type: String, required: true },
            lanes: { type: String, required: true },
            name: { type: String, required: true },
            oneway: { type: String, required: true },
            source: { type: String, required: true },
            surface: { type: String, required: true }

        }
    }
)
export const routeModule = mongoose.models.routes || mongoose.model("route", routeSchema);