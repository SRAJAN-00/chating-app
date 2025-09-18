import { useState } from "react";

export function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-white rounded-xl shadow-md max-w-sm mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-2">Sign In</h2>
      <input
        className="px-4 py-2 rounded-md border border-gray-300 w-full"
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="px-4 py-2 rounded-md border border-gray-300 w-full"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
        Sign In
      </button>
    </div>
  );
}

export function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-white rounded-xl shadow-md max-w-sm mx-auto mt-8">
      <h2 className="text-2xl font-semibold mb-2">Sign Up</h2>
      <input
        className="px-4 py-2 rounded-md border border-gray-300 w-full"
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="px-4 py-2 rounded-md border border-gray-300 w-full"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        className="px-4 py-2 rounded-md border border-gray-300 w-full"
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">
        Sign Up
      </button>
    </div>
  );
}
