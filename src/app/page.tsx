"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RadioClient from "@/components/radio-client";

function RadioAppContent() {
  const searchParams = useSearchParams();
  const experienceId = searchParams.get('experienceId') || 'dev-radio';
  
  return <RadioClient experienceId={experienceId} />;
}

export default function RadioApp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">loading radio...</div>
      </div>
    }>
      <RadioAppContent />
    </Suspense>
  );
}
