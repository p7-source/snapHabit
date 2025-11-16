# SnapHabit 🍽️

**Snap a photo. Get nutrition insights. Eat smarter — effortlessly.**

An AI-powered meal tracker built with Next.js 14, Firebase, Google Cloud Vision API, and OpenAI GPT-4o-mini.

## Features

- 📸 **Photo Upload**: Drag-and-drop or file upload for meal photos
- 🤖 **AI Food Detection**: Uses Google Cloud Vision API to identify food items
- 🧠 **Nutrition Analysis**: GPT-4o-mini estimates calories and macronutrients
- 💡 **AI Insights**: Personalized advice on missing nutrients
- 📊 **Dashboard**: Track all your meals with nutrition summaries
- 🔐 **Authentication**: Email/password and Google Sign-In via Firebase Auth
- 💾 **Cloud Storage**: Images stored in Firebase Storage
- 📱 **Responsive Design**: Clean, modern UI built with TailwindCSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **UI Components**: shadcn/ui
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Cloud Vision API, OpenAI GPT-4o-mini

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Auth, Firestore, and Storage enabled
- OpenAI API key
- Google Cloud Vision API key (optional - uses mock if not provided)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd snaphabit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Google Cloud Vision API Configuration (Optional)
   GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_api_key_here
   ```

4. **Set up Firebase**

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google Sign-In)
   - Create a Firestore database
   - Enable Firebase Storage
   - Copy your Firebase config values to `.env.local`

5. **Set up Firestore Security Rules**

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /meals/{mealId} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
       }
     }
   }
   ```

6. **Set up Firebase Storage Rules**

   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /meals/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
snaphabit/
├── app/
│   ├── api/
│   │   └── analyze-food/    # API route for food analysis
│   ├── dashboard/            # Dashboard page
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── upload/               # Upload page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── components/
│   ├── auth/                 # Authentication components
│   ├── upload/               # Upload components
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── firebase.ts           # Firebase configuration
│   └── utils.ts              # Utility functions
├── types/
│   └── meal.ts               # TypeScript types
└── .env.local.example        # Environment variables template
```

## Usage

1. **Register/Login**: Create an account or sign in with Google
2. **Upload Meal**: Go to the upload page and add a photo of your meal
3. **Analyze**: Click "Analyze Meal" to get AI-powered nutrition insights
4. **Save**: Save the meal to your dashboard
5. **Track**: View all your meals and nutrition summaries on the dashboard

## API Routes

### `/api/analyze-food`

Analyzes a food image and returns nutrition information.

**Method**: POST  
**Body**: FormData with `image` file  
**Response**: JSON with `foodName`, `calories`, `macros`, and `aiAdvice`

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Notes

- The app uses mock food detection if `GOOGLE_CLOUD_VISION_API_KEY` is not provided
- Make sure to set up proper Firebase security rules for production
- The app requires authentication for accessing upload and dashboard pages

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
