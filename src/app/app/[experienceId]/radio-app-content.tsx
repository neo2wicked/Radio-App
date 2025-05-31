"use client";

import { useParams, useSearchParams } from "next/navigation";
import RadioApp from "@/components/radio-client";
import { useEffect, useState } from "react";

export default function RadioAppContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [experienceId, setExperienceId] = useState<string | null>(null);
  
  useEffect(() => {
    // debug what we're getting
    console.log('params:', params);
    console.log('searchParams:', searchParams.toString());
    console.log('window.location:', window.location.href);
    
    // try multiple ways to get experienceId
    let id = params.experienceId as string;
    
    // if not in params, try to extract from current URL
    if (!id) {
      // whop might pass it in a different way
      const urlPath = window.location.pathname;
      console.log('urlPath:', urlPath);
      
      // extract from path like /test-2c-962c/whop-radio-fSGr1b3flatm8E/app/
      const pathParts = urlPath.split('/');
      console.log('pathParts:', pathParts);
      
      // look for experience-like ids (starts with exp_ or long alphanumeric)
      for (const part of pathParts) {
        if (part.startsWith('exp_') || (part.length > 10 && /^[a-zA-Z0-9]+$/.test(part))) {
          id = part;
          console.log('found potential experienceId:', id);
          break;
        }
      }
    }
    
    // fallback - try from search params
    if (!id) {
      id = searchParams.get('experienceId') || searchParams.get('experience') || '';
    }
    
    console.log('final experienceId:', id);
    setExperienceId(id);
  }, [params, searchParams]);
  
  if (!experienceId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-red-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p>extracting experience id from url...</p>
          <div className="mt-4 text-xs opacity-50">
            <p>url: {typeof window !== 'undefined' ? window.location.href : 'loading...'}</p>
            <p>params: {JSON.stringify(params)}</p>
          </div>
        </div>
      </div>
    );
  }

  return <RadioApp experienceId={experienceId} />;
} 