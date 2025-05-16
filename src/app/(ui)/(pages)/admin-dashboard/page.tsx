"use client";

import React from "react";

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Example stat cards */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-blue-600 mb-2">12</span>
          <span className="text-gray-700">Pending Requests</span>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-green-600 mb-2">8</span>
          <span className="text-gray-700">Active Users</span>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold text-yellow-600 mb-2">3</span>
          <span className="text-gray-700">System Alerts</span>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-8 min-h-[200px] flex items-center justify-center text-gray-400">
        More admin features coming soon...
      </div>
    </div>
  );
} 