import { Router } from "express";
import { getBillsHistory } from "../controllers/bills.controller.js";
import { downloadBillPdf } from "../controllers/bills.controller.js";

const billsRouter = Router();

// Auth required, GET /bills/history
billsRouter.get("/bills/history", getBillsHistory);

// Auth required, GET /bills/:invoiceId.pdf to downloadBillPdf controller
billsRouter.get("/bills/:invoiceId.pdf", downloadBillPdf);

export default billsRouter;
