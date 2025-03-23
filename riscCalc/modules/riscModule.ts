import mongoose from 'mongoose';

const BuildingSchema = new mongoose.Schema
    ({
        id: { type: Number, required: true },
        type: { type: String, required: true },
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
        name: { type: String, required: true },
        unactif_mouth: [{ type: [{ type: Number }], required: true }],//if it s empty it means full year [1-12]
        unactif_days: [{ type: [{ type: Date }], required: true }],//if it s empty it means 7j/7j [1-31]
        activity_hours: [{ type: [{ type: Number }], required: true }],// la forme de temps est un float 

    });



const RouteSchema = new mongoose.Schema
    ({
        id: { type: Number, required: true },
        nodes: [{ lat: { type: Number, required: true }, lon: { type: Number, required: true } }],
        tags: {
            highway: { type: String, required: true },
            name: { type: String, required: true },
            speed: { type: Number, required: true },
            accident: { type: Number, required: true },
        }
    });




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


const configSchema = new mongoose.Schema({
    zones: [{
        type: String,
        riscP: String,
        riscC: String,
    }],
    buildings: [{

        type: String,
        riscP: String,
        riscC: String,
    }],
    routes: [{

        type: String,
        riscP: String,
        riscC: String,

    }],
    building_mappings: [{
        original_type: String,
        mapped_type: String
    }],
    route_mappings: [{
        original_type: String,
        mapped_type: String
    }],
    zone_mappings: [{
        original_type: String,
        mapped_type: String
    }],
    processed_bboxes: [{
        name: String,
        min_lat: Number,
        max_lat: Number,
        min_lon: Number,
        max_lon: Number
    }]
});






export const Config = mongoose.models.configs || mongoose.model('Config', configSchema);

export const Building = mongoose.models.buildings || mongoose.model('buildings', BuildingSchema);

export const Route = mongoose.models.routes || mongoose.model('routes', RouteSchema);

export const Zone = mongoose.models.zones || mongoose.model('zones', ZoneSchema);

