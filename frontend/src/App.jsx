import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

        {/* Five Distinct Service Detail Pillars */}
        <Route path="services/yoga-wellness" element={<ServiceDetail forcedSlug="yoga-wellness" />} />
        <Route path="services/vastu" element={<ServiceDetail forcedSlug="vastu" />} />
        <Route path="services/astrology" element={<ServiceDetail forcedSlug="astrology" />} />
        <Route path="services/corporate-wellbeing" element={<ServiceDetail forcedSlug="corporate-wellbeing" />} />
        <Route path="services/food-as-medicine" element={<ServiceDetail forcedSlug="food-as-medicine" />} />
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
