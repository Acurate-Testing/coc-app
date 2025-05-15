"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  console.log("object", session);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3>Dashboard</h3>
              <button
                className="btn btn-danger"
                onClick={() => router.push("/api/auth/signout")}
              >
                Logout
              </button>
            </div>
            <div className="card-body">
              <h4>Welcome, {session?.user?.name}!</h4>
              <p>You are logged in as: {session?.user?.email}</p>
              <div className="mt-4">
                <h5>Your Account Information</h5>
                <ul className="list-group">
                  <li className="list-group-item">
                    Name: {session?.user?.name}
                  </li>
                  <li className="list-group-item">
                    Email: {session?.user?.email}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
