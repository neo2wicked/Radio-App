"use client";

import dynamic from 'next/dynamic';

// lazy load the component with no SSR to avoid hydration issues
// because we need window access for url parsing anyway
const RadioAppDynamic = dynamic(() => import('./radio-app-content'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-white bg-red-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p>starting radio app...</p>
      </div>
    </div>
  )
});

export default function AppPage() {
  return <RadioAppDynamic />;
} 