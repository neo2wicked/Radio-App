import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { experienceId, creatorId } = await request.json();
    
    if (!experienceId) {
      return NextResponse.json(
        { error: 'experienceId is required' },
        { status: 400 }
      );
    }

    // use the new whop api functions
    const { createTopicPost, sendJoinMessage } = await import("@/lib/whop-api");
    
    console.log('creating forum post:', {
      experienceId,
      creatorId
    });
    
    // create forum post (title and content are now hardcoded in the function)
    const forumResult = await createTopicPost(experienceId, creatorId);

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