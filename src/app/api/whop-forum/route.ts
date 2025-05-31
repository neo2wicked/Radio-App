import { NextRequest, NextResponse } from 'next/server';
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { experienceId, title, content } = await request.json();
    
    console.log('🎯 whop-forum api called (agent user creates posts):', {
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

    // debug all incoming headers (for troubleshooting)
    const headersList = await headers();
    console.log('📋 request headers received');

    // no user authentication needed - agent user creates the posts
    console.log('🤖 using agent user to create forum post (as per whop docs)');

    // use the whop api function (with agent user)
    const { createTopicPost } = await import("@/lib/whop-api");
    
    console.log('🔍 calling createTopicPost with agent user...');
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