"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");

    if (token) {
      // User is authenticated, redirect to join room
      router.push("/joinRoom");
    } else {
      // User is not authenticated, redirect to sign in
      router.push("/signin");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-neutral-100 to-blue-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-neutral-600">Loading...</p>
      </div>
    </div>
  );
}
