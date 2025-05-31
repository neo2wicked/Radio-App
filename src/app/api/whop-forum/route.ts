import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken, whopApi } from "@/lib/whop-api";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { experienceId, title, content } = await request.json();
    
    console.log('🎯 whop-forum api called with proper authentication:', {
      experienceId,
      title,
      content,
      timestamp: new Date().toISOString()
    });
    
    if (!experienceId || !title || !content) {
      console.error('❌ missing required fields:', { experienceId, title, content });
      return NextResponse.json(
        { error: 'experienceId, title, and content are required' },
        { status: 400 }
      );
    }

    // debug all incoming headers
    const headersList = await headers();
    console.log('📋 debugging incoming request headers:');
    Array.from(headersList.entries()).forEach(([name, value]) => {
      if (name.toLowerCase().includes('token') || name.toLowerCase().includes('auth') || name.toLowerCase().includes('whop')) {
        console.log(`  🔍 ${name}: ${value.substring(0, 20)}...`);
      }
    });

    // verify user authentication (finally!)
    console.log('🔐 attempting token validation...');
    const userToken = await verifyUserToken(headersList);
    if (!userToken) {
      console.error('❌ unauthorized: no valid user token');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ user authenticated:', userToken.userId);

    // check if user has admin access (like the working implementation)
    console.log('🔐 checking admin access...');
    const hasAccess = await whopApi.checkIfUserHasAccessToExperience({
      userId: userToken.userId,
      experienceId,
    });

    console.log('🔍 access check result:', hasAccess);

    if (hasAccess.hasAccessToExperience.accessLevel !== "admin") {
      console.error('❌ unauthorized: admin access required, got:', hasAccess.hasAccessToExperience.accessLevel);
      return NextResponse.json(
        { error: "Unauthorized, admin access required" },
        { status: 401 }
      );
    }

    console.log('✅ admin access verified');

    // use the whop api function (now with proper auth)
    const { createTopicPost } = await import("@/lib/whop-api");
    
    console.log('🔍 calling createTopicPost with authenticated user...');
    const result = await createTopicPost(experienceId, title, content);

    console.log('✅ forum post created:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'forum post created successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ whop forum post error:');
    console.error('❌ error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('❌ error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ error stack:', error instanceof Error ? error.stack : 'no stack available');
    
    return NextResponse.json(
      { 
        error: 'failed to create forum post',
        details: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 