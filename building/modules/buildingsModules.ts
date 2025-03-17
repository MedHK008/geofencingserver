import mongoose from "mongoose";

const buildingSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    type: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    name: { type: String, required: true },
})

export const buildingModule = mongoose.models.buildings || mongoose.model("building", buildingSchema);

