import mongoose from "mongoose";
const zoneSchema = new mongoose.Schema(

    {
        id: { type: Number, required: true },
        type: { type: String, required: true },
        bounds: {
            minlat: { type: Number, required: true },
            minlon: { type: Number, required: true },
            maxlat: { type: Number, required: true },
            maxlon: { type: Number, required: true },
        },
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
            natural: { type: String },
            landuse: { type: String },
            leisure: { type: String },
        },
        buildings: [{ type: Number, required: true }],
        routes: [{ type: Number, required: true }],
        trafficLights: [{ type: Number, required: true }],

    }
)
export const zoneModule = mongoose.models.zones || mongoose.model("zone", zoneSchema);