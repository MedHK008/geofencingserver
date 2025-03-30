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
   
app.use("/api/accidents_per_zone", getAccidentPerZoneRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Endpoint not found" });
});

const PORT = process.env.PORT ;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
