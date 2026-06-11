import { Router } from "express";
import { getAllHoildays } from "../controllers/holidays.controller";
import {
  getAttendance,
  saveAttendance,
  getCurrentAttendance,
} from "../controllers/attendence.controller";

const router = Router();

router.get("/holidays", getAllHoildays);
router.get("/attendence/:userId", getAttendance);
router.post("/attendence", saveAttendance);
router.get("/current/:userId", getCurrentAttendance);

export default router;
