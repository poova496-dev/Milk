# 🥛 Manjula Milk Forming - Mobile App

A complete Android app for daily milk sales management built with **React Native (Expo)** and **Supabase**.

## Features

- 👥 **Customer Management** - Add, edit, delete, search customers
- 📝 **Daily Milk Entry** - Quick preset quantity buttons + custom entry
- 📋 **Entry History** - Filter by customer, date range with summary
- 💰 **Payment & Billing** - Auto-detect billing period, calculate totals
- 🧾 **Invoice Generation** - Professional PDF invoices, download & share
- 📊 **Payment History** - View/print/share past invoices
- ⚙️ **Fixed Rate Management** - Set rates with history tracking
- 📱 **Dashboard** - Today's summary, quick actions

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PDF**: expo-print + expo-sharing
- **Navigation**: React Navigation (Stack)

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ installed
- npm or yarn
- Android Studio (for APK building)
- Expo CLI: `npm install -g expo-cli`

### 2. Clone & Install

```bash
cd manjula-milk-forming
npm install
```

### 3. Supabase Database Setup

1. Go to your Supabase project: https://ioixjvjklzbgogwfqxfx.supabase.co
2. Open **SQL Editor**
3. Run the schema file: `supabase/schema.sql`
4. (Optional) Run seed data: `supabase/seed.sql`
5. Create storage bucket:
   - Go to **Storage** → **New Bucket**
   - Name: `invoices`
   - Set to **Public**

### 4. Run the App

```bash
# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on Android emulator
npx expo run:android
```

### 5. Build APK (Android)

#### Option A: Using EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview
```

#### Option B: Using Android Studio
```bash
# Generate native project
npx expo prebuild --platform android

# Open in Android Studio
# File → Open → select the `android` folder

# Build APK from Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

The APK will be in: `android/app/build/outputs/apk/release/`

## Project Structure

```
manjula-milk-forming/
├── App.js                          # Entry point
├── src/
│   ├── config/
│   │   ├── supabase.js            # Supabase client
│   │   └── theme.js               # Colors, fonts, spacing
│   ├── screens/
│   │   ├── SplashScreen.js        # Loading screen
│   │   ├── DashboardScreen.js     # Home dashboard
│   │   ├── CustomerScreen.js      # Customer CRUD
│   │   ├── DailyEntryScreen.js    # Milk entry
│   │   ├── HistoryScreen.js       # Entry history
│   │   ├── PaymentScreen.js       # Bill & payment
│   │   ├── PaymentHistoryScreen.js # Payment records
│   │   ├── FixedRateScreen.js     # Rate management
│   │   ├── InvoicePreviewScreen.js # Invoice view
│   │   └── SettingsScreen.js      # App settings
│   ├── services/
│   │   ├── customerService.js     # Customer API
│   │   ├── entryService.js        # Daily entry API
│   │   ├── paymentService.js      # Payment API
│   │   ├── rateService.js         # Rate API
│   │   └── invoiceService.js      # Invoice API
│   ├── utils/
│   │   ├── helpers.js             # Utility functions
│   │   └── invoiceTemplate.js     # Invoice HTML
│   └── navigation/
│       └── AppNavigator.js        # Navigation setup
├── supabase/
│   ├── schema.sql                 # Database schema
│   └── seed.sql                   # Sample data
└── README.md
```

## Database Tables

| Table | Description |
|-------|-------------|
| `customers` | Customer records with name, phone, status |
| `daily_entries` | Daily milk quantity entries with rate snapshot |
| `milk_rates` | Rate history with effective dates |
| `payments` | Payment records with billing periods |
| `invoices` | Invoice records with PDF URLs |
| `invoice_counter` | Auto-increment invoice numbers |
| `app_users` | App user accounts |

## Color Theme

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Dark | `#1F4D1C` | Headers, primary buttons |
| Secondary | `#2E7D32` | Accent actions, links |
| Light Green | `#E8F3E8` | Backgrounds, highlights |
| Cream | `#F8F6EF` | Alternate backgrounds |
| Error Red | `#D32F2F` | Errors, warnings |

## Business Details

- **Name**: Manjula Milk Forming
- **Address**: Naranikuppam (vil), Kodipall (Po), Krishnagiri (Tk) (Dt), Tamilnadu - 635115
- **Phone**: 9585278394
- **Invoice Format**: MMF/YYYY/0001

## License

Private - Manjula Milk Forming © 2026
