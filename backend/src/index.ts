import express from "express";
import type { Request, Response } from "express";
import connectDB from "./db/postgres.js";
import cors from "cors";
import recommendationRoutes from "./routes/recommendation.routes.js";
import dotenv from "dotenv";
import holidayRoutes from "./routes/utils.routes.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use("/", recommendationRoutes);
app.use("/", holidayRoutes);

app.get("/ping", (req: Request, res: Response) => res.status(200).send("pong"));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on PORT : ${PORT}`);
  });
});
