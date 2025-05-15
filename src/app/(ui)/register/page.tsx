"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      if (!response.ok) {
        const data = await response.text();
        throw new Error(data);
      }
      router.push("/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card-shadow w-full max-w-md bg-white rounded-2xl mx-auto p-8">
        <h3 className="text-2xl font-semibold text-center mb-6">Register</h3>

        {error && (
          <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-300 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full h-[50px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block font-medium mb-1">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full h-[50px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full px-3 py-2 h-[50px] border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[56px] bg-[#0052ff] text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {isLoading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>

    // <div className="container mt-5">
    //   <div className="row justify-content-center">
    //     <div className="col-md-6">
    //       <div className="card shadow">
    //         <div className="card-header">
    //           <h3 className="text-center">Register</h3>
    //         </div>
    //         <div className="card-body">
    //           {error && (
    //             <div className="alert alert-danger" role="alert">
    //               {error}
    //             </div>
    //           )}
    //           <form onSubmit={handleSubmit}>
    //             <div className="mb-3">
    //               <label htmlFor="name" className="form-label">
    //                 Name
    //               </label>
    //               <input
    //                 type="text"
    //                 className="form-control"
    //                 id="name"
    //                 name="name"
    //                 required
    //               />
    //             </div>
    //             <div className="mb-3">
    //               <label htmlFor="email" className="form-label">
    //                 Email address
    //               </label>
    //               <input
    //                 type="email"
    //                 className="form-control"
    //                 id="email"
    //                 name="email"
    //                 required
    //               />
    //             </div>
    //             <div className="mb-3">
    //               <label htmlFor="password" className="form-label">
    //                 Password
    //               </label>
    //               <input
    //                 type="password"
    //                 className="form-control"
    //                 id="password"
    //                 name="password"
    //                 required
    //               />
    //             </div>
    //             <button
    //               type="submit"
    //               className="btn btn-primary w-100"
    //               disabled={isLoading}
    //             >
    //               {isLoading ? "Loading..." : "Register"}
    //             </button>
    //           </form>
    //           <div className="mt-3 text-center">
    //             <p>
    //               Already have an account? <Link href="/login">Login</Link>
    //             </p>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
}
