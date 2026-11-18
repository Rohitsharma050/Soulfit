import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Journal from './pages/Journal';
import Contact from './pages/Contact';
import Legal from './pages/Legal';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BookConsultation from './pages/BookConsultation';
import MyConsultations from './pages/MyConsultations';
import ProtectedRoute from './components/common/ProtectedRoute';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Homepage rendering all 7 narrative sections */}
        <Route index element={<Home />} />

        {/* Public Core Pages */}
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />

        {/* Dynamic Service Detail Pillar Routes */}
        <Route path="services/soulfit" element={<Navigate to="/services/yoga-wellness" replace />} />
        <Route path="services/:slug" element={<ServiceDetail />} />

        {/* Insights & Direct Contact */}
        <Route path="journal" element={<Journal />} />
        <Route path="contact" element={<Contact />} />

        {/* Authentication & User Identity (Phase 4) */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Consultation Booking & Member Appointments (Phase 5) */}
        <Route
          path="book"
          element={
            <ProtectedRoute>
              <BookConsultation />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-consultations"
          element={
            <ProtectedRoute>
              <MyConsultations />
            </ProtectedRoute>
          }
        />

        {/* Legal & Standards */}
        <Route path="privacy" element={<Legal type="privacy" />} />
        <Route path="terms" element={<Legal type="terms" />} />
        <Route path="ethics" element={<Legal type="ethics" />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
