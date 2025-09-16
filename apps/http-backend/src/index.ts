import express from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middlware";
import { JWT_SECRET } from "@repo/backend-common/config";
import { SignInSchema, SignUpSchema } from "@repo/common/types";

const app = express();

app.post("./api/v1/signup", (req, res) => {
  const parsedData = SignUpSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "incorrect input",
    });
    return;
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }
  // Here you would normally add code to save the user to your database
  return res.status(201).json({ message: "User created successfully" });
});

app.post("./api/v1/signin", (req, res) => {
  const parsedData = SignInSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "incorrect input",
    });
    return;
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }
  const userId = 1;
  const token = jwt.sign({ userId }, JWT_SECRET);
  // Here you would normally add code to verify the user's credentials
  return res.status(200).json({
    token,
    message: "User signed in successfully",
  });
});

app.post("./api/v1/room", middleware, (req, res) => {
  const parsedData = SignInSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "incorrect input",
    });
    return;
  }
  res.json({ roomId: "roomId" });
});
app.listen(3001);
