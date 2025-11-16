# 🚀 Next Steps - Build & Deploy to TestFlight

## ✅ What We've Done So Far:

1. ✅ EAS CLI installed and logged in as `amitmahajan78`
2. ✅ App icon created and placed in `assets/icon.png`
3. ✅ `app.json` updated with icon references
4. ✅ Environment variables configured
5. ✅ Bundle identifier set: `com.aurumx.mobile`

---

## 📋 Now Run These Commands:

### Step 1: Initialize EAS Project (2 minutes)

```bash
cd /Users/amitmahajan/Documents/Projects/Gold-App/gold-hub-mobile
eas init
```

**What will happen:**
- You'll be prompted to name your project
- Suggested name: `aurumx-mobile` (press Enter to accept)
- EAS will create a project on Expo servers
- Your `app.json` will be updated with a project ID

**Expected output:**
```
✔ What would you like to name your project? … aurumx-mobile
✔ Created @amitmahajan78/aurumx-mobile on Expo
✔ Updated app.json
```

---

### Step 2: Configure EAS Build (1 minute)

```bash
eas build:configure
```

**What will happen:**
- You'll be asked: "Which platforms?" 
  - **Answer**: Choose **iOS** (use arrow keys and space to select)
- This creates an `eas.json` file with build profiles

**Expected output:**
```
✔ Which platforms would you like to configure for EAS Build? › iOS
✔ Generated eas.json
```

---

### Step 3: Build for iOS (15-20 minutes)

```bash
eas build --platform ios --profile production
```

**What will happen:**
1. EAS will ask about iOS credentials (first time only)
2. You may need to provide:
   - Apple ID (your developer account email)
   - App-specific password (generate at appleid.apple.com)
3. EAS uploads your code to build servers
4. Build happens in the cloud (you can close terminal)
5. You'll get a notification when done

**Expected output:**
```
✔ iOS credentials set up
✔ Compressing project files
✔ Uploading to EAS Build
✔ Queued build
✔ Build in progress... (this takes ~15-20 minutes)
✔ Build completed!
✔ Download: https://expo.dev/artifacts/...
```

---

### Step 4: Submit to TestFlight (5-10 minutes)

After build completes:

```bash
eas submit --platform ios --latest
```

**What will happen:**
- Uses your latest iOS build
- Uploads to App Store Connect automatically
- Creates TestFlight build

**Expected output:**
```
✔ Submitting to Apple App Store
✔ Upload successful
✔ Processing... (Apple takes 5-30 minutes)
```

---

## 🎯 Quick Command Sequence

Copy and paste these one at a time:

```bash
# Navigate to project
cd /Users/amitmahajan/Documents/Projects/Gold-App/gold-hub-mobile

# Step 1: Initialize
eas init

# Step 2: Configure
eas build:configure

# Step 3: Build (this takes time)
eas build --platform ios --profile production

# Step 4: Submit (run after build completes)
eas submit --platform ios --latest
```

---

## ⏱️ Timeline

| Step | Duration | Can Close Terminal? |
|------|----------|---------------------|
| `eas init` | 30 seconds | No |
| `eas build:configure` | 30 seconds | No |
| `eas build` upload | 2-3 minutes | No |
| `eas build` building | 15-20 minutes | ✅ Yes |
| `eas submit` | 5-10 minutes | No |
| App Store processing | 15-30 minutes | ✅ Yes |
| **Total** | **40-60 minutes** | |

---

## 🆘 Common Issues

### "Invalid bundle identifier"
**Fix**: Ensure `com.aurumx.mobile` is registered in Apple Developer Portal
- Go to: https://developer.apple.com/account/resources/identifiers/list
- Click "+" to register if needed

### "Credentials error"
**Fix**: Generate app-specific password
- Go to: https://appleid.apple.com
- Sign In → Security → App-Specific Passwords
- Generate new password
- Use that when EAS asks

### "Build failed"
**Fix**: Check build logs
```bash
eas build:list
eas build:view [BUILD_ID]
```

---

## 📱 After TestFlight Upload

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select "AurumX"
3. Go to **TestFlight** tab
4. Wait for "Processing" to complete (15-30 mins)
5. Add internal testers (up to 100)
6. Share TestFlight link with testers
7. Test the app!

---

## 🎉 Ready?

**Start with:**
```bash
cd /Users/amitmahajan/Documents/Projects/Gold-App/gold-hub-mobile
eas init
```

Then follow the prompts! Let me know if you hit any issues. 🚀
