import mongoose, { Schema, Document } from 'mongoose';


const AccidentSchema: Schema = new Schema(
    {
        city: { type: String, required: true },
        accidents: { type: Number, required: true },
    },
  
);


const ZoneSchema = new mongoose.Schema
    ({
        zoneId: { type: String, required: true },
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
        buildings: [{ type: mongoose.Schema.Types.ObjectId, ref: "buildings", required: true }],
        routes: [{ type: mongoose.Schema.Types.ObjectId, ref: "routes", required: true }],
        cross_walks: { type: Number, required: true },
    });


    const RouteSchema = new mongoose.Schema
    ({
        id: { type: Number, required: true },
        nodes: [{ lat: { type: Number, required: true }, lon: { type: Number, required: true } }],
        tags: {
            highway: { type: String, required: true },
            name: { type: String, required: true },
            speed: { type: Number, required: true },
            accident: { type: Number, required:false },
        }
    });

export const Accident = mongoose.models.accidents||mongoose.model('accidents', AccidentSchema);
export const Zone = mongoose.models.zones || mongoose.model('zones', ZoneSchema);
export const Route = mongoose.models.routes || mongoose.model('routes', RouteSchema);
