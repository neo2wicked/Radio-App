import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { experienceId, title, content } = await request.json();
    
    console.log('🎯 whop-forum api called (whop-map pattern):', {
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

    // use the whop api function (same pattern as whop-map)
    const { createTopicPost } = await import("@/lib/whop-api");
    
    console.log('🔍 calling createTopicPost...');
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