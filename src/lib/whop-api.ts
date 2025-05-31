import { WhopServerSdk } from "@whop/api";
import { validateToken } from "@whop-apps/sdk";

// check environment variables properly (not hardcoded like a caveman)
const API_KEY = process.env.WHOP_API_KEY;

console.log('🔑 whop api environment check:', {
  hasKey: !!API_KEY,
  keyPrefix: API_KEY?.substring(0, 15) + '...' || 'MISSING',
  keyLength: API_KEY?.length || 0,
  appId: process.env.WHOP_APP_ID,
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV
});

if (!API_KEY) {
  console.error('❌ WHOP_API_KEY environment variable is missing!');
  throw new Error('WHOP_API_KEY environment variable is required');
}

console.log('✅ creating whop server sdk with app api key only...');

// create sdk without hardcoded user - we'll authenticate per request
export const whopApi = WhopServerSdk({
  appApiKey: API_KEY,
});

console.log('✅ whop server sdk created successfully');

// proper user token validation using whop-apps-sdk
export const verifyUserToken = async (headersList: Headers) => {
  try {
    console.log('🔍 attempting to validate user token...');
    
    // debug what headers we actually have
    const userTokenHeader = headersList.get('X-Whop-User-Token');
    const authHeader = headersList.get('authorization');
    console.log('📋 available headers:', {
      userToken: userTokenHeader ? 'present' : 'missing',
      auth: authHeader ? 'present' : 'missing',
      allHeaders: Array.from(headersList.entries())
    });
    
    // use the proper whop-apps-sdk validateToken function
    const { userId } = await validateToken({ headers: headersList });
    
    if (!userId) {
      console.error('❌ no valid user found from token');
      return null;
    }
    
    console.log('✅ user token validated successfully:', userId);
    return {
      userId,
      token: userTokenHeader
    };
    
  } catch (error) {
    console.error('❌ token validation failed:', error);
    return null;
  }
};

// send websocket message with proper company context (not just basic app permissions)
export const sendJoinMessage = async (experienceId: string) => {
  try {
    console.log('📡 sending join message with company context...');
    console.log('experienceId:', experienceId);
    
    // get company context from experience (same pattern as forum creation)
    const whopExperience = await whopApi.getExperience({ experienceId });
    const bizId = whopExperience.experience?.company.id;
    
    if (!bizId) {
      console.error('❌ no company id found in experience');
      return { error: true, reason: 'no company context found' };
    }
    
    console.log('✅ got company context:', bizId);
    
    // send websocket message with proper targeting
    const result = await whopApi.sendWebsocketMessage({
      message: JSON.stringify({ 
        type: 'user_joined',
        text: '🎵 someone joined the radio station',
        timestamp: Date.now(),
        experienceId: experienceId,
        companyId: bizId
      }),
      target: { experience: experienceId },
    });
    
    console.log('✅ websocket join message sent successfully');
    return result;
    
  } catch (error) {
    console.error('❌ websocket message failed:', error);
    // don't crash the app if websocket fails
    return { 
      error: true, 
      reason: error instanceof Error ? error.message : String(error) 
    };
  }
};

// create forum post using APP-LEVEL permissions (not user permissions, genius)
export const createTopicPost = async (experienceId: string, title: string, content: string) => {
  try {
    console.log('🎯 creating forum post with app-level permissions...');
    console.log('input experienceId:', experienceId);
    
    // step 1: get experience details to get bizId 
    console.log('📡 fetching experience details...');
    const whopExperience = await whopApi.getExperience({ experienceId });
    const bizId = whopExperience.experience?.company.id;
    
    if (!bizId) {
      throw new Error('no company id found in experience response');
    }
    
    console.log('✅ got bizId:', bizId);
    
    // step 2: create forum experience with app-level permissions (simplified approach)
    console.log('🗂️ creating forum experience with app permissions...');
    let forumExperienceId: string | undefined;
    
    try {
      const forumResult = await whopApi.findOrCreateForum({
        input: {
          experienceId: experienceId,
          name: "Radio Station Chat",
          whoCanPost: "everyone",
        },
      });
      
      forumExperienceId = forumResult.createForum?.id;
      
      if (!forumExperienceId) {
        throw new Error('failed to create forum - app may not have forum creation permissions');
      }
      
      console.log('✅ created/found forum experience:', forumExperienceId);
    } catch (createError) {
      console.error('❌ forum creation failed with app permissions:', createError);
      // fallback: just skip forum posting if we can't create forums
      console.log('⚠️ skipping forum post creation - no forum permissions');
      return { 
        skipped: true, 
        reason: 'app lacks forum creation permissions in this company' 
      };
    }
    
    // step 3: create forum post (this should work with app permissions)
    console.log('📤 creating forum post...');
    const postResult = await whopApi.createForumPost({
      input: {
        forumExperienceId: forumExperienceId,
        title: `🎵 ${title}`,
        content: `${content}\n\n*radio announcement*`,
        isMention: true,
      },
    });
    
    console.log('✅ forum post created:', postResult);
    return postResult;
    
  } catch (error) {
    console.error('❌ forum post creation failed:', error);
    // don't crash the entire app if forum posting fails - radio should still work
    return { 
      error: true, 
      reason: error instanceof Error ? error.message : String(error) 
    };
  }
};
