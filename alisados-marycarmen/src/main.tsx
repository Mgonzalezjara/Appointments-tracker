import React from "react";
import type { ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authContext.tsx";
import LoginPage from "./pages/client/LoginPage";
import DashboardLayout from "./pages/professional/DashboardLayout";
import ProfilePage from "./pages/professional/ProfilePage";
import ServicesPage from "./pages/professional/ServicesPage";
import CalendarPage from "./pages/professional/CalendarPage";
import AccountsPage from "./pages/professional/AccountsPage.tsx";
import ClientCalendarPage from "./pages/client/ClientCalendarPage.tsx";
import LandingPage from "./pages/client/LandingPage";
import ServicesPublicPage from "./pages/client/ServicesPublicPage";
import LandingHome from "./pages/client/LandingHome";
import ScheduleConfigPage from "./pages/professional/ScheduleConfigPage.tsx";

import "./styles/App.css";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
}
const PROFESSIONAL_UID = "XrNrVJJrZaSBYJF8WnNj2a3p0iW2";

const router = createBrowserRouter([
   {
    path: "/",
    element: <LandingPage />,
    children: [
      { index: true, element: <LandingHome /> }, // ✅ Hero solo aquí
      { path: "login", element: <LoginPage /> },
      { path: "servicios", element: <ServicesPublicPage professionalId={PROFESSIONAL_UID} /> },
      { path: "getcitas", element: <ClientCalendarPage professionalId={PROFESSIONAL_UID} /> },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="calendar" replace /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "services", element: <ServicesPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "accounts", element: <AccountsPage /> },
      { path: "schedule-config", element: <ScheduleConfigPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
