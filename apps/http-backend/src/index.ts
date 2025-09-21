import express from "express";
import jwt from "jsonwebtoken";
import { middleware } from "./middlware";
import { JWT_SECRET } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  SignInSchema,
  SignUpSchema,
} from "@repo/common/types";
import { prisma } from "@repo/db/client";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/v1/signup", async (req, res) => {
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
  try {
    const user = await prisma.user.create({
      data: {
        email: parsedData.data.username,
        password: parsedData.data.password,
        name: parsedData.data?.name,
      },
    });
    console.log(user);
    const userId = user.id;
    const token = jwt.sign({ userId }, JWT_SECRET);
    // Here you would normally add code to save the user to your database
    return res
      .status(201)
      .json({ message: "User created successfully", token, userId });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error creating user" });
  }
});

app.post("/api/v1/signin", async (req, res) => {
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
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: username,
        password: password,
      },
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const userId = user.id;
    const token = jwt.sign({ userId }, JWT_SECRET);
    // Here you would normally add code to verify the user's credentials
    return res.status(200).json({
      token,
      message: "User signed in successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error signing in" });
  }
});

app.post("/api/v1/room", middleware, async (req, res) => {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "incorrect input",
    });
    return;
  }
  const userId = req.userId;
  try {
    const room = await prisma.room.create({
      data: {
        slug: parsedData.data.name,
        adminId: String(userId),
      },
    });
    res.json({ message: "room successfully created", roomId: room.id });
  } catch (e) {
    console.log(e);
  }
});

app.get("/api/v1/chat/:roomId", async (req, res) => {
  const roomId = Number(req.params.roomId);
  const messages = await prisma.chat.findMany({
    where: {
      roomId: roomId,
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  res.json({ messages });
});
app.get("/api/v1/room/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const room = await prisma.room.findFirst({
      where: {
        slug,
      },
    });
    res.json({ room });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error fetching room" });
  }
});
app.get("/api/v1/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
});
app.listen(3001);
