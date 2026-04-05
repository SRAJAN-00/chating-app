"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import AuthShell from "../components/AuthShell";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (!username || !password || !email) {
      setErrorMsg("Please fill in all fields.");
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

      // Redirect to join room page
      router.push("/joinRoom");
    } catch (err) {
      console.error("Sign up error:", err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = username.trim().length > 0 && password.trim().length > 0 && email.trim().length > 0;

  return (
    <AuthShell
      title="Create account"
      description="One account for all your shared canvases."
    >
      {errorMsg && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Username
          </label>
          <input
            type="text"
            placeholder="Pick a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            required
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            required
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="btn-primary mt-2"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already registered?{" "}
        <Link
          href="/signin"
          className="font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
