"use client";
import React from "react";
import DashboardLayout from "../components/Dashboard/DashboardLayout";

const Layout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

export default Layout;
