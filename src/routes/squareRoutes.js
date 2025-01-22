import express from "express";
import { Router } from "express";
import { authorizeSquare, getItems, squareCallback } from "../controllers/squareController.js";

const router = Router();

//Square generate access & refresh token
router.get("/authorize", authorizeSquare)
router.get("/callback", squareCallback)

//Interact with Square API
router.get("/items", getItems)

export default router;