import app from "./app";
import dotenv from "dotenv";
import { CLEANUP_INTERVAL_MS, clearStaleCache } from "./controllers/imagesController";

dotenv.config();

const PORT: number | string = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  setInterval(clearStaleCache, CLEANUP_INTERVAL_MS);
});
