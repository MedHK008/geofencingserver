import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();
export const connectToDB = async () => {

    try {
        const MONGO_URI = process.env.MONGO_URI as string;
        await mongoose.connect(MONGO_URI);
        mongoose.set('strictQuery', true);
        console.log("connect to geofence-app db ");
    } catch (error) {
        console.error("error in connection to geofence-app db");
    }
}