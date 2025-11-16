#!/bin/bash

# 🚀 AurumX Pre-Deployment Checklist Script
# Run this before building for TestFlight

echo "🔍 AurumX Pre-Deployment Checklist"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: Not in the correct directory"
    echo "Please run this from: /Users/amitmahajan/Documents/Projects/Gold-App/gold-hub-mobile"
    exit 1
fi

echo "✅ In correct directory"
echo ""

# Check EAS CLI
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found"
    echo "Please install: npm install -g eas-cli"
    exit 1
fi
echo "✅ EAS CLI installed"

# Check EAS login
EAS_USER=$(eas whoami 2>&1)
if [[ $EAS_USER == *"amitmahajan78"* ]]; then
    echo "✅ Logged into Expo as: amitmahajan78"
else
    echo "❌ Not logged into Expo"
    echo "Please run: eas login"
    exit 1
fi
echo ""

# Check for required files
echo "📁 Checking required files..."

if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check if .env has required variables
    if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env && grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env; then
        echo "✅ Supabase environment variables configured"
    else
        echo "⚠️  Warning: Missing Supabase environment variables in .env"
    fi
else
    echo "❌ .env file missing"
fi

if [ -f "app.json" ]; then
    echo "✅ app.json exists"
else
    echo "❌ app.json missing"
fi

if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json missing"
fi

echo ""

# Check for assets
echo "🎨 Checking app assets..."

if [ -f "assets/icon.png" ]; then
    echo "✅ App icon exists (assets/icon.png)"
    
    # Check icon size (requires ImageMagick: brew install imagemagick)
    if command -v identify &> /dev/null; then
        ICON_SIZE=$(identify -format "%wx%h" assets/icon.png 2>/dev/null)
        if [ "$ICON_SIZE" = "1024x1024" ]; then
            echo "✅ App icon is correct size (1024x1024)"
        else
            echo "⚠️  Warning: App icon size is $ICON_SIZE (should be 1024x1024)"
        fi
    fi
else
    echo "❌ App icon missing (assets/icon.png)"
    echo "   Create a 1024x1024 PNG icon and save as assets/icon.png"
fi

if [ -f "assets/splash.png" ]; then
    echo "✅ Splash screen exists (assets/splash.png)"
else
    echo "⚠️  Splash screen missing (assets/splash.png)"
    echo "   Optional but recommended"
fi

echo ""

# Check app.json configuration
echo "⚙️  Checking app.json configuration..."

BUNDLE_ID=$(grep -o '"bundleIdentifier": *"[^"]*"' app.json | cut -d'"' -f4)
if [ "$BUNDLE_ID" = "com.aurumx.mobile" ]; then
    echo "✅ Bundle identifier: $BUNDLE_ID"
else
    echo "⚠️  Bundle identifier: $BUNDLE_ID"
fi

APP_VERSION=$(grep -o '"version": *"[^"]*"' app.json | head -1 | cut -d'"' -f4)
echo "ℹ️  App version: $APP_VERSION"

echo ""

# Check if node_modules is up to date
echo "📦 Checking dependencies..."

if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
    
    # Check if package.json is newer than node_modules
    if [ "package.json" -nt "node_modules" ]; then
        echo "⚠️  Warning: package.json is newer than node_modules"
        echo "   Consider running: npm install"
    fi
else
    echo "❌ node_modules missing"
    echo "   Run: npm install"
fi

echo ""

# Check .gitignore
echo "🔐 Checking .gitignore..."

if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore; then
        echo "✅ .env is in .gitignore (secrets protected)"
    else
        echo "❌ .env is NOT in .gitignore"
        echo "   Add .env to .gitignore to protect secrets!"
    fi
else
    echo "⚠️  .gitignore missing"
fi

echo ""

# Check if EAS project is initialized
echo "🏗️  Checking EAS project..."

if grep -q '"projectId"' app.json; then
    PROJECT_ID=$(grep -o '"projectId": *"[^"]*"' app.json | cut -d'"' -f4)
    if [ "$PROJECT_ID" != "your-eas-project-id" ]; then
        echo "✅ EAS project initialized"
        echo "   Project ID: $PROJECT_ID"
    else
        echo "⚠️  EAS project not initialized (using placeholder)"
        echo "   Run: eas init"
    fi
else
    echo "⚠️  No EAS project ID found"
    echo "   Run: eas init"
fi

echo ""

# Final summary
echo "======================================"
echo "📋 Summary"
echo "======================================"
echo ""

echo "Next steps:"
echo ""
echo "1. Create app icon (if missing):"
echo "   - Create 1024x1024 PNG"
echo "   - Save as: assets/icon.png"
echo ""
echo "2. Initialize EAS project (if needed):"
echo "   cd /Users/amitmahajan/Documents/Projects/Gold-App/gold-hub-mobile"
echo "   eas init"
echo ""
echo "3. Configure EAS build:"
echo "   eas build:configure"
echo ""
echo "4. Build for iOS:"
echo "   eas build --platform ios --profile production"
echo ""
echo "5. Submit to TestFlight:"
echo "   eas submit --platform ios --latest"
echo ""

echo "📖 Full guide: See DEPLOYMENT_GUIDE.md"
echo ""
