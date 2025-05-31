import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { experienceId, title, content, creatorId } = await request.json();
    
    if (!experienceId || !title || !content) {
      return NextResponse.json(
        { error: 'experienceId, title, and content are required' },
        { status: 400 }
      );
    }

    // use the new whop api functions
    const { createTopicPost, sendJoinMessage } = await import("@/lib/whop-api");
    
    console.log('creating forum post:', {
      experienceId,
      title,
      creatorId
    });
    
    // create forum post  
    const forumResult = await createTopicPost(experienceId, title, content);

    console.log('forum post created:', forumResult);
    
    // send websocket message about new topic
    const messageResult = await sendJoinMessage(experienceId);

    console.log('websocket message sent:', messageResult);
    
    return NextResponse.json({ 
      success: true, 
      message: 'forum post created and message sent',
      data: { forumResult, messageResult }
    });
    
  } catch (error) {
    console.error('creator topic error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: 'failed to create topic',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 