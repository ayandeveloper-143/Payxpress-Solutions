import { Router } from "express";
import { getProductBySlug, getProducts } from "../controllers/product.controller.js";

const productRouter = Router();

productRouter.get("/products", getProducts);
productRouter.get("/products/:slug", getProductBySlug);

export default productRouter;