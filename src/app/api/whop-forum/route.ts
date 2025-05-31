import { NextRequest, NextResponse } from 'next/server';
import { createTopicPost, verifyUserToken } from '@/lib/whop-api';

export async function POST(request: NextRequest) {
  try {
    const { experienceId, title, content } = await request.json();
    
    if (!experienceId || !title || !content) {
      return NextResponse.json(
        { error: 'experienceId, title, and content are required' },
        { status: 400 }
      );
    }

    console.log('🎯 forum post request:', { experienceId, title, content });
    
    // verify user authentication (proper way for multi-tenant app)
    const userAuth = await verifyUserToken(request.headers);
    
    if (!userAuth) {
      console.error('❌ user authentication failed');
      return NextResponse.json(
        { error: 'user authentication required - app must be loaded within whop iframe' },
        { status: 401 }
      );
    }
    
    console.log('✅ user authenticated:', userAuth.userId);
    
    // create forum post with authenticated user context
    const result = await createTopicPost(experienceId, title, content);

    console.log('✅ forum post created successfully:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'forum post created successfully',
      data: result,
      userId: userAuth.userId
    });
    
  } catch (error) {
    console.error('❌ forum post creation failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // return detailed error for debugging
    return NextResponse.json(
      { 
        error: 'failed to create forum post',
        details: error instanceof Error ? error.message : String(error),
        suggestion: 'check that user has forum permissions in this whop company'
      },
      { status: 500 }
    );
  }
} 