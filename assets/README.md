# AurumX App Icon & Splash Screen

## Missing Assets

You need to create these files before building:

### 1. App Icon (REQUIRED)
- **File**: `assets/icon.png`
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **Requirements**:
  - Square image
  - No transparency (solid background)
  - Will be automatically resized for different devices
  
**Quick option**: Use a logo/icon generator:
- [Figma](https://www.figma.com) - Design your icon
- [Canva](https://www.canva.com) - Use templates
- [App Icon Generator](https://www.appicon.co) - Generate from image

**Suggested Design**:
- Gold/yellow theme (matches your app)
- Simple, recognizable symbol (like a gold bar, AU symbol, or crown)
- Dark background (#0A0A0B - your app's background color)
- Gold accents (#D4AF37 - your gold color)

### 2. Splash Screen (OPTIONAL but recommended)
- **File**: `assets/splash.png`
- **Size**: 1284x2778 pixels (or 1242x2688)
- **Format**: PNG
- **Requirements**:
  - Background: #0A0A0B (your app's dark background)
  - Center your logo/icon
  - Will be scaled for different devices

---

## Temporary Solution (For Testing)

If you want to build NOW for testing without a custom icon, I can create a simple placeholder:

### Option 1: Use Expo's default icon temporarily
Just comment out the icon lines in app.json temporarily:
```json
{
  "expo": {
    // "icon": "./assets/icon.png",
    // ... rest of config
  }
}
```

### Option 2: Create a simple solid color icon
Create a 1024x1024 PNG with:
- Solid gold background (#D4AF37)
- Text "AX" or "AU" in center
- Dark text color (#0A0A0B)

---

## After You Have the Icon

1. Save it as: `assets/icon.png`
2. Update `app.json`:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",  // if you have it
      "resizeMode": "contain",
      "backgroundColor": "#0A0A0B"
    },
    "ios": {
      "icon": "./assets/icon.png"
    }
  }
}
```

3. Run the checklist again:
```bash
./pre-deploy-check.sh
```

4. Proceed with EAS build:
```bash
eas init
eas build:configure
eas build --platform ios --profile production
```

---

## Need Help Creating an Icon?

I can help you:
1. Design specifications
2. Color palette suggestions
3. Icon concept ideas

Just let me know what you'd like the icon to look like!
