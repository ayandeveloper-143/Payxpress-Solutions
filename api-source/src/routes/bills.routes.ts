import { Router } from "express";
import { getBillsHistory } from "../controllers/bills.controller.js";

const billsRouter = Router();

// Auth required, GET /bills/history
billsRouter.get("/bills/history", getBillsHistory);

export default billsRouter;
