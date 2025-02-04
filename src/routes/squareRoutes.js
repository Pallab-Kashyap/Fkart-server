import express from "express";
import { Router } from "express";
import { authorizeSquare, fetchSquareCatalogList, squareCallback } from "../controllers/squareController.js";

const router = Router();

//Square generate access & refresh token
router.get("/authorize", authorizeSquare)
router.get("/callback", squareCallback)

//Webhook
// router.get("/webhook/notif", (req, res) => {
//   res.status(200).send("Webhook received get")
// })
// router.post("/webhook/notif", (req, res) => {
//   console.log(req.body,)
//   res.status(200).send("Webhook received post")
// })
// router.post("/webhook", (req, res) => {
//   console.log(req.body)
//   res.send("Webhook received")
// })

//Interact with Square API
router.get("/items", fetchSquareCatalogList)

export default router;