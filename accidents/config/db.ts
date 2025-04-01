import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.set('strictQuery', true); // Suppress deprecation warning

const connectToDatabase = async (uri: string, dbName: string): Promise<void> => {
    try {
        await mongoose.connect(uri, { dbName });
        console.log(`Connected to database: ${dbName}`);
    } catch (error) {
        console.error(`Error connecting to database: ${dbName}`, error);
    }
};

export const connectToAccidentDB = async () => {
    const MONGO_URI_ACCIDENT = process.env.MONGO_URI_accident as string;

    if (!MONGO_URI_ACCIDENT) {
        console.error("MONGO_URI_accident environment variable is not defined.");
        return;
    }

    await connectToDatabase(MONGO_URI_ACCIDENT, "historical_accidents");
};