'use client';

import React from 'react';
import { useSQLMindStore } from '../hooks/useSQLMindStore';
import LandingPage from '../components/LandingPage';
import DashboardLayout from '../components/Dashboard/Layout';

export default function Home() {
  const { dbId } = useSQLMindStore();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500/30 selection:text-violet-200 antialiased">
      {dbId === null ? (
        <LandingPage />
      ) : (
        <DashboardLayout />
      )}
    </div>
  );
}
