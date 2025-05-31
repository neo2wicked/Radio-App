# whop radio app

a premium radio streaming app with steve jobs-level design that integrates perfectly with whop's platform.

## what it does

- 🎵 premium porsche-inspired radio button with real audio streaming
- 🔐 full whop authentication and access control integration
- 📱 responsive design that looks incredible on all devices  
- 🔔 automatic push notifications when users join or events happen
- 💬 creator forum post creation for starting discussions
- 👥 live listener count with smooth animations
- 🚫 zero broken websockets or fake features

## features

### premium ui design
- steve jobs-inspired button with gradient layers and haptic feedback
- smooth animations and ripple effects when playing
- elegant status indicators and listener counters
- glassmorphism design elements with perfect spacing

### whop platform integration
- **notifications**: sends push notifications when users join radio
- **forum posts**: creators can start discussion topics that become forum posts
- **authentication**: validates user access via whop's auth system
- **experience-based**: each whop experience gets its own radio instance

## setup (don't mess this up)

1. **install dependencies**
   ```bash
   npm install
   ```

2. **create `.env.local` file with your whop app credentials:**
   ```env
   # get these from your whop app dashboard at https://whop.com/apps
   WHOP_API_KEY=your_whop_api_key_here
   NEXT_PUBLIC_WHOP_APP_ID=your_whop_app_id_here
   
   # optional: custom radio stream url
   RADIO_STREAM_URL=https://usa9.fastcast4u.com/proxy/jamz?mp=/1
   ```

3. **set up your whop app**
   - go to [whop apps dashboard](https://whop.com/apps)
   - create a new app
   - copy your api key and app id to the env file
   - configure the app view to point to `/app/[experienceId]`
   - enable notifications and forum permissions

4. **run the development server**
   ```bash
   npm run dev
   ```

## how it works

### standalone version (localhost:3001)
- access directly at `/` for testing
- no authentication required
- premium button with basic functionality

### whop app version (for production)
- users access at `/app/[experienceId]` 
- requires whop authentication 
- validates user access to the experience
- sends notifications on user events
- creates forum posts from creator prompts

## api endpoints

### `/api/whop-notification` (POST)
sends push notifications via whop's notification system:
```json
{
  "experienceId": "exp_123",
  "type": "user_joined", 
  "message": "New listener joined the radio! 🎵"
}
```

### `/api/whop-forum` (POST)
creates forum posts for discussion topics:
```json
{
  "experienceId": "exp_123",
  "title": "🎵 Radio Discussion Topic",
  "content": "What's your favorite genre?"
}
```

## project structure

```
src/
├── app/
│   ├── page.tsx                       # standalone demo version
│   ├── app/[experienceId]/page.tsx    # whop authenticated version
│   ├── api/whop-notification/         # notification api endpoint
│   ├── api/whop-forum/               # forum post api endpoint
│   └── layout.tsx
├── components/
│   └── radio-client.tsx               # premium radio component
```

## customizing

### radio stream
edit `src/components/radio-client.tsx` and change the audio src:

```tsx
<audio 
  ref={audioRef}
  src="https://your-stream-url.com/radio.mp3"
  // ...
/>
```

### button design
modify the gradient colors and effects in the button section:

```tsx
className="bg-gradient-to-b from-red-400 via-red-500 to-red-700"
```

### notification triggers
customize when notifications are sent in the `sendJoinNotification` function.

## deployment

1. deploy to vercel, netlify, or your hosting provider
2. add your environment variables in the hosting dashboard
3. update your whop app configuration to point to your deployed url
4. set the iframe url to `https://your-domain.com/app/[experienceId]`
5. configure whop app permissions for notifications and forum access

## troubleshooting

- **"audio failed to play"**: try a different radio stream url or check cors settings
- **"access denied"**: check your whop app configuration and api keys
- **"experience not found"**: make sure the experienceId exists in your whop app
- **notifications not working**: verify whop app has notification permissions enabled
- **forum posts failing**: check forum api permissions in whop dashboard

## why this is better

unlike other radio apps that look like they were designed in 2010:
- this has actual premium design inspired by apple and porsche
- uses whop's platform features properly (notifications, forum posts)
- no broken websockets or fake functionality
- actually works when deployed and scales properly
- follows modern ui/ux principles with smooth animations

the button alone is worth more than most entire radio apps.

---

*built with next.js, tailwind, impeccable taste, and zero tolerance for mediocrity*
