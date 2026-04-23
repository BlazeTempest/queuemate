"use client";

import AppLayout from '@/components/layout/AppLayout';

export default function MainPagesLayout({ children }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}