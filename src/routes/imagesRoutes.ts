import { Router } from "express";
import { getImages, getSortedImages } from "../controllers/imagesController";

const router: Router = Router();

router.get("/", getImages);
router.get("/sorted", getSortedImages);

export default router;
