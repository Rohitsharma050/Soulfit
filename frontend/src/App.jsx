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
