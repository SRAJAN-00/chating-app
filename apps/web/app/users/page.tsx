"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      const response = await axios.get(`${BACKEND_URL}/users`);
      console.log(response.data);
      setUsers(response.data);
    }
    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <ul>
        {users.map((data: any) => (
          <li key={data.id} className="mb-2">
            {data.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
