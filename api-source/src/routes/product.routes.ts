import { Router } from "express";
import { getProductBySlug, getProducts, downloadProductFile } from "../controllers/product.controller.js";

const productRouter = Router();


productRouter.get("/products", getProducts);
productRouter.get("/products/:slug", getProductBySlug);
// Download endpoint
productRouter.get("/download/:slug", downloadProductFile);

export default productRouter;