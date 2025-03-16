import mongoose from "mongoose";
const zoneSchema = new mongoose.Schema(

    {
        zoneId: { type: String, required: true },
        geometry: {
            type: [
                {
                    lat: { type: Number, required: true },
                    lon: { type: Number, required: true },
                }
            ],
            required: true
        },
        tags: {
            landuse: { type: String },
        },
        buildings: [{ type: Number, required: true }],
        routes: [{ type: Number, required: true }],
        trafficLights: [{ type: Number, required: true }],

    }
)
export const zoneModule = mongoose.models.zones || mongoose.model("zones", zoneSchema);