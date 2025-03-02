import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();
export const connectToDB = async () => {

    try {
        const MONGO_URI = process.env.MONGO_URI as string;
        await mongoose.connect(MONGO_URI);
        console.log("connect to db ");
    } catch (error) {
        console.error("error in connection to db");
    }
}