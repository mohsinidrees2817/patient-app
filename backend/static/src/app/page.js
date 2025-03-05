"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Home() {
  const [apiResponse, setApiResponse] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/health")
      .then((response) => response.json())
      .then((data) => setApiResponse(data))
      .catch((err) => setError("Failed to connect to backend"));
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/users");
        const data = await response.json();
        console.log(data.users, "response");
        setUsers(data.users);
      } catch {
        setError("Failed to fetch users");
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              src/app/page.js
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        {/* API Connection Status */}
        <div className="p-4 border rounded-md bg-gray-100 dark:bg-gray-800">
          <h2 className="text-lg font-semibold">Backend Connection Status:</h2>
          {apiResponse ? (
            <p className="text-green-600">{JSON.stringify(apiResponse)}</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-blue-600">Checking...</p>
          )}
        </div>

        {/* User List */}
        <div className="p-4 border rounded-md bg-gray-100 dark:bg-gray-800">
          <h2 className="text-lg font-semibold">Users:</h2>
          {users?.length > 0 ? (
            <ul>
              {users.map((user, index) => (
                <li key={index} className="text-blue-600">
                  {user.name} - {user.email}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-red-600">No users found</p>
          )}
        </div>
      </main>
    </div>
  );
}
