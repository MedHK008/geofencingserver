import mongoose from "mongoose";
const zoneSchema = new mongoose.Schema
    ({
        geometry: [{ lat: { type: Number, required: true }, lon: { type: Number, required: true } }],
        bounding_box: [

            {
                lat: { type: Number, required: true },
                lon: { type: Number, required: true },
            }
        ],


        tags: {
            landuse: { type: String, required: false },

        },
        zoneId: { type: String, required: true },
        buildings: [{ type: mongoose.Schema.Types.ObjectId, ref: "buildings", required: true }],
        routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "routes", required: true }],
        cross_walks: { type: Number, required: true },
    });
export const zoneModule = mongoose.models.zones || mongoose.model("zone", zoneSchema);
