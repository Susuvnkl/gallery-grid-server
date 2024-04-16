import cors from "cors";
import express, { Express } from "express";
import imagesRoutes from "./routes/imagesRoutes";
import errorHandler from "./middleware/errorHandler";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use("/images", imagesRoutes);
app.use(errorHandler);

export default app;
