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

// send websocket message using app-level permissions
export const sendJoinMessage = async (experienceId: string) => {
  return whopApi.sendWebsocketMessage({
    message: JSON.stringify({ 
      type: 'user_joined',
      text: '🎵 someone joined the radio station',
      timestamp: Date.now()
    }),
    target: { experience: experienceId },
  });
};

// create forum post using AUTHENTICATED USER instead of hardcoded agent
export const createTopicPost = async (experienceId: string, title: string, content: string, userToken?: string) => {
  try {
    console.log('🎯 creating forum post with authenticated user...');
    console.log('input experienceId:', experienceId);
    
    // step 1: get experience details to get bizId 
    console.log('📡 fetching experience details...');
    const whopExperience = await whopApi.getExperience({ experienceId });
    const bizId = whopExperience.experience?.company.id;
    
    if (!bizId) {
      throw new Error('no company id found in experience response');
    }
    
    console.log('✅ got bizId:', bizId);
    
    // step 2: find or create a forum experience using company context
    console.log('🗂️ finding or creating forum experience...');
    const forumResult = await whopApi
      .withCompany(bizId)
      .findOrCreateForum({
        input: {
          experienceId: experienceId,
          name: "Radio Station Chat",
          whoCanPost: "everyone",
        },
      });
    
    const forumExperienceId = forumResult.createForum?.id;
    
    if (!forumExperienceId) {
      throw new Error('failed to find or create forum experience');
    }
    
    console.log('✅ got forum experience id:', forumExperienceId);
    
    // step 3: create forum post using company context
    console.log('📤 creating forum post with company context...');
    const postResult = await whopApi
      .withCompany(bizId)
      .createForumPost({
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
    throw error;
  }
};
