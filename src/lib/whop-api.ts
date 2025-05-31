import { WhopServerSdk } from "@whop/api";

console.log('🔑 whop api environment check:', {
  hasKey: !!process.env.WHOP_API_KEY,
  keyPrefix: process.env.WHOP_API_KEY?.substring(0, 15) + '...',
  keyLength: process.env.WHOP_API_KEY?.length,
  appId: process.env.WHOP_APP_ID,
  agentUserId: process.env.WHOP_AGENT_USER_ID,
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV
});

if (!process.env.WHOP_API_KEY) {
  console.error('❌ WHOP_API_KEY environment variable is missing!');
  throw new Error('WHOP_API_KEY environment variable is required');
}

console.log('✅ creating whop server sdk with updated config...');

// use whop server sdk with proper config (add companyId like docs show)
export const whopApi = WhopServerSdk({
  appApiKey: process.env.WHOP_API_KEY ?? "fallback",
  onBehalfOfUserId: process.env.WHOP_AGENT_USER_ID ?? "fallback",
  // add companyId parameter as shown in whop docs
  companyId: undefined,
});

console.log('✅ whop server sdk created with updated auth config');

// send websocket message (this already works)
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

// create forum post using the same pattern as working whop-map example
export const createTopicPost = async (experienceId: string, title: string, content: string) => {
  try {
    console.log('🎯 creating forum post using whop-map pattern...');
    console.log('input experienceId:', experienceId);
    
    // step 1: get experience details to get bizId (same as working example)
    console.log('📡 fetching experience details...');
    const whopExperience = await whopApi.getExperience({ experienceId });
    const bizId = whopExperience.experience?.company.id;
    
    if (!bizId) {
      throw new Error('no company id found in experience response');
    }
    
    console.log('✅ got bizId:', bizId);
    
    // step 2: create/find forum (exact same pattern as working example)
    console.log('🏛️ creating/finding forum...');
    let forumId: string = experienceId; // fallback
    
    try {
      const forumResult = await whopApi
        .withCompany(bizId)
        .findOrCreateForum({
          input: {
            experienceId: experienceId,
            name: "Radio Discussions",
            whoCanPost: "everyone",
          },
        });
      
      forumId = forumResult.createForum?.id || experienceId;
      console.log('✅ forum ready:', forumId);
    } catch (forumError) {
      console.log('⚠️ forum creation failed, using experienceId as fallback');
    }
    
    // step 3: create forum post (exact same pattern as working example)
    console.log('📤 creating forum post...');
    const postResult = await whopApi
      .withCompany(bizId)
      .createForumPost({
        input: {
          forumExperienceId: forumId,
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
