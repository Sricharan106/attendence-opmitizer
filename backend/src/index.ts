import express from "express";
import connectDB from "./db/postgres";
import cors from "cors";
import recommendationRoutes from "./routes/recommendation.routes";
import dotenv from "dotenv";
import holidayRoutes from "./routes/utils.routes";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith("http://localhost"))
        return callback(null, true);
      const clientUrl = process.env.CLIENT_URL;
      if (clientUrl && origin === clientUrl) return callback(null, true);
      return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

app.use("/", recommendationRoutes);
app.use("/", holidayRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on PORT : ${PORT}`);
  });
});
