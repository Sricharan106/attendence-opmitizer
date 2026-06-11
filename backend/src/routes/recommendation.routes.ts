import { Router } from "express";
import { getRecommendations } from "../controllers/recommendation.controller";
import { syncTelanganaGovHolidays } from "../services/holidays.service";

const router = Router();

// Endpoint accessible via: GET /api/optimizer/recommendations?userId=1
router.get("/optimizer/recommendations", getRecommendations);

// Alternative structural pattern: GET /api/optimizer/recommendations/1
router.get("/optimizer/recommendations/:userId", getRecommendations);

// sync hoidays in database with actuall hoiday list
router.get("/optimizer/sync", syncTelanganaGovHolidays);

export default router;
