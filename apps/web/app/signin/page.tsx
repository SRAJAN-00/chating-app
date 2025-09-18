"use client";
import { useState } from "react";
import CustomButton from "../components/Button";
import Button from "../components/Button";
import { Input } from "../components/Input";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handleSignIn = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/signin`, {
        username,
        password,
      });
      console.log(response.data.userId);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userId); // <-- Add this line!

      if (response.status === 201) {
        router.push("/joinroom");
      }
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center justify-center gap-6 p-8 bg-neutral-100 rounded-2xl border border-neutral-300 shadow-xl max-w-sm border-white/20">
        <h2 className="text-3xl font-bold text-neutral-700 tracking-tight drop-shadow">
          Sign In
        </h2>
        <p className="text-base text-neutral-700 text-center opacity-90">
          Welcome back! Please enter your credentials.
        </p>
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button onClick={handleSignIn} variant="gray">
          Sign In
        </Button>

        <span className="text-sm text-neutral-500">
          Don't have an account?{" "}
          <Link href="/signup" className="underline hover:text-white">
            Sign up
          </Link>
        </span>
      </div>
    </div>
  );
}
