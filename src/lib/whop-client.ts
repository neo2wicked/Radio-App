"use client";

// proper whop app authentication - pass user token to server routes
export class WhopAppClient {
  private experienceId: string;

  constructor(experienceId: string) {
    this.experienceId = experienceId;
  }

  private getUserToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    // get the whop_user_token cookie that whop automatically sets
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'whop_user_token') {
        console.log('🍪 found whop_user_token cookie');
        return value;
      }
    }
    
    console.error('🍪 whop_user_token cookie not found, available cookies:', document.cookie);
    return null;
  }

  async createForumPost(title: string, content: string) {
    console.log('🎯 creating forum post via server route with user token...');
    
    const userToken = this.getUserToken();
    
    if (!userToken) {
      throw new Error('whop_user_token cookie not found - app must be loaded within whop iframe');
    }

    try {
      console.log('📤 making server api call with user token...');
      
      const response = await fetch('/api/whop-forum', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Whop-User-Token': userToken, // pass user token to server
        },
        body: JSON.stringify({
          experienceId: this.experienceId,
          title,
          content,
        }),
      });
      
      console.log('📬 server response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ server route failed:', result);
        throw new Error(`server error: ${result.error} - ${result.details}`);
      }
      
      console.log('✅ forum post created via server route:', result);
      return result;
      
    } catch (error) {
      console.error('❌ whop app forum post failed:', error);
      throw error;
    }
  }
}

// create whop app client instance
export const createWhopAppClient = (experienceId: string) => {
  return new WhopAppClient(experienceId);
}; 