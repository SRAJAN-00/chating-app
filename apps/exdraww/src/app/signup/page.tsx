"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BACKEND_URL } from "../../../config";

// Adjust to your backend URL

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!username || !password || !email) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/signup`, {
        username,
        password,
        email,
      });

      // Store token and userId in localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userId);

      console.log("Sign up successful:", response.data);

      // Redirect to join room page
      router.push("/joinRoom");
    } catch (err) {
      console.error("Sign up error:", err);
      alert("Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-neutral-100 to-blue-100">
      <div className="flex flex-col items-center justify-center gap-6 p-8 bg-white rounded-2xl border border-neutral-300 shadow-xl w-full max-w-sm">
        <h2 className="text-3xl font-bold text-blue-700 tracking-tight drop-shadow">
          Sign Up
        </h2>
        <p className="text-base text-neutral-700 text-center opacity-90">
          Create your account to start drawing!
        </p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="px-4 py-2 rounded-lg border text-blue-400 border-neutral-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-2 rounded-lg border text-blue-400 border-neutral-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-4 py-2 rounded-lg border border-neutral-300 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition w-full disabled:opacity-50"
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <span className="text-sm text-neutral-500">
          Already have an account?{" "}
          <a
            href="/signin"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Sign in
          </a>
        </span>
      </div>
    </div>
  );
}
