import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { experienceId, message, type } = await request.json();
    
    if (!experienceId || !message) {
      return NextResponse.json(
        { error: 'experienceId and message are required' },
        { status: 400 }
      );
    }

    // use the new websocket approach
    const { sendJoinMessage } = await import("@/lib/whop-api");
    
    console.log('attempting websocket message with:', {
      experienceId,
      message,
      type
    });
    
    const result = await sendJoinMessage(experienceId);

    console.log('websocket message sent:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'websocket message sent',
      data: { experienceId, message, type, result }
    });
    
  } catch (error) {
    console.error('websocket message error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        error: 'failed to send websocket message',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 