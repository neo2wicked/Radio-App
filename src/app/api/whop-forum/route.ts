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

    // verify user authentication (finally!)
    const headersList = await headers();
    const userToken = await verifyUserToken(headersList);
    if (!userToken) {
      console.error('❌ unauthorized: no valid user token');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ user authenticated:', userToken.userId);

    // check if user has admin access (like the working implementation)
    const hasAccess = await whopApi.checkIfUserHasAccessToExperience({
      userId: userToken.userId,
      experienceId,
    });

    if (hasAccess.hasAccessToExperience.accessLevel !== "admin") {
      console.error('❌ unauthorized: admin access required');
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