import { Router } from "express";
import * as ctrl from "../controllers/expense.controller.js";

const router = Router();

router.post("/", ctrl.create);
router.get("/summary", ctrl.summary);
router.get("/", ctrl.list);

export default router;
