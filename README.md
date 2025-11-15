# AurumX ✨

**Next-gen gold market intelligence platform** for iOS and Android.

> **Aurum** = Latin for gold (Au) | **X** = exchange, analysis, next-gen

A premium React Native + Expo mobile app for comparing gold prices globally and managing price alerts.

## 📱 Features

- **Gold Price Comparator**: Compare gold prices across two markets with real-time calculations
- **Live Rates**: View current gold prices in GBP, USD, and INR with interactive charts
- **Price Alerts**: Create custom alerts with email and SMS notifications
- **Google Sign-In**: Secure authentication via Supabase Auth
- **Dark Mode First**: Beautiful premium UI with gold accents
- **Cross-Platform**: Full support for iOS and Android

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Studio (for emulators)
- Supabase project with existing schema

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd gold-hub-mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web (for testing)
   npm run web
   ```

## 📁 Project Structure

```
src/
├── navigation/       # Navigation configuration
├── screens/          # Screen components
│   ├── auth/        # Splash, Onboarding, Login
│   ├── home/        # Comparator screen
│   ├── rates/       # Live rates screen
│   ├── alerts/      # Alerts screen
│   └── profile/     # Profile screen
├── components/       # Reusable UI components
│   ├── ui/          # Basic primitives (Button, Card, Input)
│   ├── shared/      # Composite components
│   ├── comparator/  # Comparator-specific
│   ├── alerts/      # Alert-specific
│   └── rates/       # Rates-specific
├── hooks/           # Custom React hooks
├── lib/             # External service clients
├── utils/           # Pure utility functions
├── types/           # TypeScript definitions
├── store/           # Global state (Zustand)
├── theme/           # Design system tokens
└── assets/          # Images, icons, fonts
```

## 🎨 Design System

The app uses a comprehensive design system with:
- **Colors**: Dark mode first with gold accents (#D9A441)
- **Typography**: Inter font family with defined text styles
- **Spacing**: Consistent 4px-based scale
- **Shadows**: Multiple elevation levels for depth
- **Animations**: Smooth micro-interactions with Reanimated

## 🔐 Authentication

- Google Sign-In via Supabase Auth
- Session persistence with expo-secure-store
- Protected routes for authenticated features
- RLS policies enforced at database level

## 📊 Data Flow

```
App Launch
  ↓
Check Session (Secure Store)
  ↓
┌─────────────┬─────────────┐
│ Authenticated│  Guest     │
├─────────────┤─────────────┤
│ Main Tabs   │ Auth Stack  │
│ - Home      │ - Onboarding│
│ - Rates     │ - Login     │
│ - Alerts    │             │
│ - Profile   │             │
└─────────────┴─────────────┘
```

## 🧪 Testing

```bash
# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

## 📦 Building

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🔧 Key Technologies

- **React Native** with **Expo SDK 51**
- **TypeScript** for type safety
- **React Navigation** for routing
- **Supabase** for backend (auth + database)
- **React Query** for data fetching
- **Zustand** for client state
- **NativeWind** for styling (Tailwind CSS)
- **Reanimated** for animations
- **React Hook Form** for form handling

## 📚 Documentation

- [Architecture](../ARCHITECTURE.md) - System design and component hierarchy
- [Implementation Plan](../IMPLEMENTATION_PLAN.md) - Detailed development roadmap
- [Progress Tracker](../PROGRESS.md) - Current development status

## 🔗 Backend Integration

This app connects to an existing Supabase backend with:

### Database Tables (DO NOT MODIFY)
- `gold_prices_cache` - Latest gold prices per currency
- `gold_rate_alerts` - User-created price alerts
- `auth.users` - Supabase managed auth

### Edge Functions
- `cache-gold-prices` - Fetches prices from Alpha Vantage
- `check-gold-alerts` - Evaluates and triggers alerts

## 🎯 Development Roadmap

- [x] Project setup and configuration
- [x] Design system implementation
- [x] Utils and business logic
- [ ] Supabase client setup
- [ ] Authentication flow
- [ ] Navigation structure
- [ ] Home/Comparator screen
- [ ] Live Rates screen
- [ ] Alerts screen
- [ ] Profile screen
- [ ] Animations and polish
- [ ] Testing

## 📄 License

Proprietary - Gold Hub

## 👥 Support

For support, email support@goldhub.com
