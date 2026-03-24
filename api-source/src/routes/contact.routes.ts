import { Router } from "express";
import { createContactEnquiry } from "../controllers/contact.controller.js";

const contactRouter = Router();

contactRouter.post("/contact", createContactEnquiry);

export default contactRouter;