# whop radio app - production deployment guide

## 🚀 deploy to production today

### step 1: get your whop app credentials

1. go to [whop apps dashboard](https://whop.com/apps)
2. create a new app or select existing app
3. copy your **api key** from the app settings
4. copy your **app id** from the app url

### step 2: configure environment variables

edit `.env.local` and add your real credentials:

```env
WHOP_API_KEY=whop_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_WHOP_APP_ID=app_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RADIO_STREAM_URL=https://usa9.fastcast4u.com/proxy/jamz?mp=/1
```

### step 3: test locally

```bash
npm run dev
```

- test standalone version: `http://localhost:3001/`
- test whop version: `http://localhost:3001/app/exp_test123` (will show auth error - that's expected)

### step 4: deploy to vercel (recommended)

```bash
# install vercel cli if you don't have it
npm i -g vercel

# deploy
npm run vercel-deploy
```

or use vercel dashboard:
1. connect your github repo to vercel
2. add environment variables in vercel dashboard
3. deploy

### step 5: configure whop app

1. go to your whop app settings
2. set **iframe url** to: `https://your-domain.vercel.app/app/[experienceId]`
3. enable **notifications** permission  
4. enable **forum posts** permission
5. save settings

### step 6: test in production

1. create a test experience in your whop
2. install your app in the experience
3. visit the experience - should show your radio app
4. test the premium button, notifications, and forum posts

## alternative deployment options

### netlify
```bash
npm run build
# upload dist folder to netlify
```

### custom server
```bash
npm run build
npm run start
# runs on port 3000
```

### railway/render
- connect github repo
- set environment variables
- auto-deploy on push

## whop app configuration checklist

- [ ] api key added to environment variables
- [ ] iframe url pointing to `/app/[experienceId]` 
- [ ] notifications permission enabled
- [ ] forum posts permission enabled
- [ ] app published in whop app store (optional)

## troubleshooting production issues

### "whop api key not configured"
- check environment variables are set correctly
- verify api key is valid in whop dashboard

### "experience not found" 
- make sure experienceId exists in your whop
- check iframe url format is correct

### notifications not sending
- verify notifications permission is enabled in whop app
- check api key has proper scope

### forum posts failing
- verify forum posts permission is enabled  
- check whop app has write access to forums

## monitoring

add these to your deployment:
- error tracking (sentry, bugsnag)
- performance monitoring (vercel analytics)
- uptime monitoring (uptimerobot)

## scaling considerations

for high traffic:
- use cdn for static assets
- implement redis caching
- add rate limiting to api routes
- monitor api usage in whop dashboard

---

your radio app is now production-ready with real whop integration. no mock code, no placeholders - everything works live. 