import mongoose from "mongoose";
const trafficLightSchema = new mongoose.Schema(

    {
        id: { type: Number, required: true },
        type: { type: String, required: true },
        lat: { type: Number, required: true },
        lon: { type: Number, required: true }
    }
)
export const trafficLightModule = mongoose.models.traffic_lights || mongoose.model("traffic_light", trafficLightSchema);