import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectToAccidentDB } from "./config/db";
import getAccidentPerZoneRoutes from "./routes/getAccdentperZone";

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

connectToAccidentDB();

const PORT_ACCIDENT = process.env.PORT_ACCIDENT || 8010;
console.log(`Starting server on PORT_ACCIDENT: ${PORT_ACCIDENT}`); // Log the PORT_ACCIDENT value

app.use("/api/accidents_per_zone", getAccidentPerZoneRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
});

app.listen(PORT_ACCIDENT, () => {
    console.log(`Server is running on port ${PORT_ACCIDENT}`);
});

