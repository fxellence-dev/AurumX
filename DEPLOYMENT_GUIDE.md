# 🚀 AurumX Deployment Guide - TestFlight

## Prerequisites Checklist ✅

Before starting, make sure you have:
- [ ] Apple Developer Account (paid, $99/year)
- [ ] Expo account (logged in as: `amitmahajan78`)
- [ ] EAS CLI installed (already installed ✅)
- [ ] App Store Connect access
- [ ] Valid bundle identifier: `com.aurumx.mobile`

---

## Step 1: Initialize EAS Project

Run these commands in your terminal:

```bash
# Navigate to project directory
cd /Users/amitmahajan/Documents/Projects/Gold-App/gold-hub-mobile

# Initialize EAS project (this will create a project ID)
eas init

# This will:
# - Create a new project on Expo servers
# - Generate a unique project ID
# - Update your app.json with the project ID
```

**Expected Output:**
```
✔ What would you like to name your project? … aurumx-mobile
✔ Created @amitmahajan78/aurumx-mobile on Expo
✔ Updated app.json
```

---

## Step 2: Configure EAS Build

```bash
# Generate eas.json configuration file
eas build:configure

# Choose:
# - Platform: iOS (for now)
# - Build profile: production
```

This creates an `eas.json` file with build configurations.

---

## Step 3: Update App Configuration

Before building, we need to ensure your `app.json` is properly configured:

### Required Changes:

1. **Add App Icon** (1024x1024 PNG)
   - Path: `assets/icon.png`
   - Must be 1024x1024 pixels
   - Square with no transparency

2. **Add Splash Screen** (1284x2778 PNG or similar)
   - Path: `assets/splash.png`
   - Will be resized for different devices

3. **Update app.json**:
```json
{
  "expo": {
    "name": "AurumX",
    "slug": "aurumx-mobile",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0A0B"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.aurumx.mobile",
      "buildNumber": "1",
      "icon": "./assets/icon.png"
    }
  }
}
```

---

## Step 4: Set Up Apple Credentials

```bash
# EAS will ask for your Apple ID and app-specific password
eas credentials

# Choose:
# - Platform: iOS
# - Set up credentials
# - Use your Apple ID: your-apple-id@email.com
# - Generate app-specific password at: https://appleid.apple.com
```

---

## Step 5: Build for iOS (TestFlight)

```bash
# Build for iOS production
eas build --platform ios --profile production

# This will:
# - Upload your code to Expo servers
# - Build the iOS app (.ipa file)
# - Take ~15-20 minutes
# - Provide a download link when done
```

**Build Process:**
```
✔ Compressing project files
✔ Uploading to EAS Build
✔ Build started
⠙ Building... (this takes ~15 minutes)
✔ Build completed
✔ IPA file: https://expo.dev/artifacts/...
```

---

## Step 6: Submit to TestFlight

### Option A: Automatic Submission (Recommended)

```bash
# Submit directly to App Store Connect
eas submit --platform ios --latest

# This will:
# - Upload the .ipa to App Store Connect
# - Create the TestFlight build automatically
# - Take ~5-10 minutes
```

### Option B: Manual Submission

1. Download the `.ipa` file from the build link
2. Go to [App Store Connect](https://appstoreconnect.apple.com)
3. Create a new app with bundle ID: `com.aurumx.mobile`
4. Use Xcode → Window → Organizer → Upload
5. Or use [Transporter app](https://apps.apple.com/app/transporter/id1450874784)

---

## Step 7: Configure TestFlight

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app "AurumX"
3. Go to **TestFlight** tab
4. Wait for "Processing" to complete (~15-30 minutes)
5. Add internal testers (up to 100)
6. Add external testers (requires Beta App Review)
7. Share the TestFlight link with testers

---

## Important Files to Check

Before building, verify these files exist and are correct:

### 1. `.env` file (DO NOT commit to git!)
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### 2. `.gitignore` (ensure .env is ignored)
```
.env
.env.local
.env.production
```

### 3. `app.json` (bundle identifier)
```json
"ios": {
  "bundleIdentifier": "com.aurumx.mobile"
}
```

---

## Expected Timeline ⏱️

| Step | Duration |
|------|----------|
| EAS Build (iOS) | 15-20 minutes |
| Upload to App Store | 5-10 minutes |
| App Store Processing | 15-30 minutes |
| Beta App Review (external) | 24-48 hours |
| **Total (internal testing)** | **35-60 minutes** |
| **Total (external testing)** | **1-2 days** |

---

## Common Issues & Solutions

### Issue: "Missing credentials"
**Solution:**
```bash
eas credentials
# Set up iOS credentials with your Apple ID
```

### Issue: "Invalid bundle identifier"
**Solution:**
- Ensure `com.aurumx.mobile` is registered in Apple Developer Portal
- Match it exactly in `app.json`

### Issue: "Missing app icon"
**Solution:**
- Create 1024x1024 PNG icon
- Save as `assets/icon.png`
- Update `app.json` to reference it

### Issue: "Build failed"
**Solution:**
```bash
# Check build logs
eas build:list
eas build:view [BUILD_ID]

# Common fixes:
# 1. Update dependencies
npm install

# 2. Clear cache and rebuild
eas build --platform ios --clear-cache
```

---

## Testing Checklist Before Deployment

- [ ] App runs without errors on Expo Go
- [ ] Sign in with Google works
- [ ] Create alert works
- [ ] Toggle alert works
- [ ] Delete alert works
- [ ] Sign out works
- [ ] All RLS policies are enabled and tested
- [ ] No console errors or warnings
- [ ] .env file is not committed to git

---

## Next Steps After TestFlight

Once your app is in TestFlight and tested:

1. **Production Release:**
   ```bash
   # Build production version
   eas build --platform ios --profile production
   
   # Submit to App Store
   eas submit --platform ios --latest
   ```

2. **App Store Listing:**
   - Add screenshots (required)
   - Write app description
   - Add privacy policy URL
   - Add support URL
   - Submit for App Review

3. **Android Build:**
   ```bash
   # Build for Android
   eas build --platform android --profile production
   
   # Submit to Google Play
   eas submit --platform android --latest
   ```

---

## Quick Command Reference

```bash
# Check EAS login
eas whoami

# List all builds
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Cancel running build
eas build:cancel

# View project info
eas project:info

# Update credentials
eas credentials

# Build locally (faster for testing)
eas build --platform ios --local

# View build logs
eas build:view --logs
```

---

## Support & Resources

- 📖 EAS Build Docs: https://docs.expo.dev/build/introduction/
- 📖 TestFlight Guide: https://developer.apple.com/testflight/
- 💬 Expo Discord: https://chat.expo.dev/
- 🐛 Issues: Check build logs with `eas build:view [BUILD_ID]`

---

## Ready to Start?

Run these commands in order:

```bash
cd /Users/amitmahajan/Documents/Projects/Gold-App/gold-hub-mobile
eas init
eas build:configure
eas build --platform ios --profile production
```

Good luck! 🚀
