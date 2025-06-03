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

console.log('✅ creating whop server sdk with app api key...');

// create sdk with proper configuration
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
    const refererHeader = headersList.get('referer');
    
    console.log('📋 available headers:', {
      userToken: userTokenHeader ? 'present' : 'missing',
      auth: authHeader ? 'present' : 'missing',
      referer: refererHeader ? 'present' : 'missing',
      allHeaders: Array.from(headersList.entries())
    });
    
    // for local development - extract dev token from referer url
    if (!userTokenHeader && refererHeader && refererHeader.includes('localhost')) {
      console.log('🔧 local development detected - extracting token from referer...');
      
      const url = new URL(refererHeader);
      const devToken = url.searchParams.get('whop-dev-user-token');
      
      if (devToken) {
        console.log('✅ found dev token in referer, creating modified headers...');
        
        // create new headers with the dev token
        const modifiedHeaders = new Headers(headersList);
        modifiedHeaders.set('X-Whop-User-Token', devToken);
        
        try {
          const { userId } = await validateToken({ headers: modifiedHeaders });
          console.log('✅ dev token validated successfully:', userId);
          return { userId, token: devToken };
        } catch (error) {
          console.log('⚠️ dev token validation failed, trying direct extraction...', error);
          
          // fallback: try to decode the JWT manually for local dev
          try {
            const payload = JSON.parse(atob(devToken.split('.')[1]));
            const userId = payload.sub;
            if (userId) {
              console.log('✅ manually extracted user id from dev token:', userId);
              return { userId, token: devToken };
            }
          } catch (decodeError) {
            console.log('❌ manual token decode failed:', decodeError);
          }
        }
      }
    }
    
    // use the proper whop-apps-sdk validateToken function for production
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
      text: 'someone just tuned into the radio 📻',
      timestamp: Date.now()
    }),
    target: { experience: experienceId },
  });
};

// create forum post using APP-LEVEL permissions (works in any whop where app is installed)
export const createTopicPost = async (experienceId: string, userId?: string) => {
  try {
    console.log('🎯 creating forum post with app-level permissions...');
    console.log('input experienceId:', experienceId);
    console.log('authenticated userId:', userId);
    
    // step 1: get experience details to construct proper app URL
    console.log('📡 fetching experience details for URL construction...');
    const whopExperience = await whopApi.getExperience({ experienceId });
    const companyId = whopExperience.experience?.company.id;
    
    if (!companyId) {
      throw new Error('no company id found in experience response');
    }
    
    console.log('✅ got company info:', { companyId });
    
    // construct proper app URL format: whop.com/{companyIdentifier}/whop-radio-{experienceIdNoPrefix}/app/
    const experienceIdNoPrefix = experienceId.replace('exp_', '');
    // use company id as the identifier (might need to be adjusted based on actual URL structure)
    const appUrl = `https://whop.com/${companyId}/whop-radio-${experienceIdNoPrefix}/app/`;
    
    console.log('🔗 constructed app url:', appUrl);
    
    // step 2: find or create a forum experience using app permissions
    console.log('🗂️ finding or creating forum experience with app permissions...');
    
    // use authenticated user context if available for forum operations
    const apiClient = userId ? whopApi.withUser(userId) : whopApi;
    
    const forumResult = await apiClient.findOrCreateForum({
      input: {
        experienceId: experienceId,
        name: "Radio Station Chat",
        whoCanPost: "everyone",
        // optional: you can add expiration or price here if needed
        // expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        // price: { baseCurrency: "usd", initialPrice: 100 }
      },
    });
    
    const forumExperienceId = forumResult.createForum?.id;
    
    if (!forumExperienceId) {
      throw new Error('failed to find or create forum experience');
    }
    
    console.log('✅ got forum experience id:', forumExperienceId);
    
    // step 3: create forum post using app permissions with user context
    console.log('📤 creating forum post with app permissions...');
    const postResult = await apiClient.createForumPost({
      input: {
        forumExperienceId: forumExperienceId,
        title: `New listener joined the radio! 📻`,
        content: `someone just tuned into the station. 🎧\n\nJoin the vibe here:\n${appUrl}`,
        isMention: true,
        // optional: add attachments, polls, paywalls, etc.
        // attachments: [{ directUploadId: "upload_id" }],
        // poll: { options: [{ id: "1", text: "Option 1" }] },
        // paywallAmount: 9.99,
        // paywallCurrency: "usd"
      },
    });
    
    console.log('✅ forum post created successfully:', postResult);
    return postResult;
    
  } catch (error) {
    console.error('❌ forum post creation failed with app permissions:', error);
    throw error;
  }
};
