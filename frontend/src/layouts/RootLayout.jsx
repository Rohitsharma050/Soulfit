import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * RootLayout
 * Architectural layout wrapper for future application views.
 */
export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-sand text-forest">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
