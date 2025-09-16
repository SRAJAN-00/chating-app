import { z } from "zod";

export const SignUpSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export const SignInSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const CreateRoomSchema = z.object({
  name: z
    .string()
    .min(3, "Room name must be at least 3 characters")
    .max(20, "Room name must be at most 20 characters"),
});
