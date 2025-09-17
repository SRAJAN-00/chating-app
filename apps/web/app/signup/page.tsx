"use client";
import { useState } from "react";
import { Input } from "../components/Input";
import Button from "../components/Button";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();
  const handleSignUp = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/signup`, {
        username,
        password,
        name,
      });
      console.log(response.data);
      localStorage.setItem("token", response.data.token);

      if (response.status === 201) {
        router.push("/joinroom");
      }
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center justify-center gap-6 p-8 bg-neutral-100 rounded-2xl border border-neutral-300 shadow-xl w-full max-w-sm border-white/20">
        <h2 className="text-3xl font-bold text-neutral-700 tracking-tight drop-shadow">
          Sign up
        </h2>
        <p className="text-base text-neutral-800 text-center opacity-90">
          Welcome! Please enter your details.
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
        <Input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={handleSignUp} variant="gray">
          Sign Up
        </Button>
        <span className="text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/signin" className="underline hover:text-white">
            Sign in
          </Link>
        </span>
      </div>
    </div>
  );
}
