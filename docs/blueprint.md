# **App Name**: MacroMate – Free AI Calorie & Macro Tracker

## Core Features:

- Authentication: User authentication using Firebase Authentication (Email/Password + Google Sign-In).
- Dashboard: Daily calorie & macro summary (Calories, Protein, Carbs, Fat, Fiber). Progress bars for each macro goal. Ability to view past days' data.
- Meal Photo: Option to Take Photo using device camera OR Upload from Gallery.
- Image recognition: Use Google Cloud Vision API tool (free tier) to identify general food items from the image.
- Macro lookup: Use USDA FoodData Central API tool to fetch calories, protein, carbs, fats, and fiber for detected foods.
- Manual Entry: Search bar connected to USDA API for food items. User enters serving size → auto-calculation of calories/macros.
- Data Storage: Firebase Firestore to store meals, macros, goals. Firebase Storage for photos.
- User Goals: Set daily calorie and macro goals in profile settings.
- Analytics: Weekly and monthly trends using charts.

## Style Guidelines:

- Minimalist card-based layout with soft shadows & pastel or AMOLED-friendly dark theme.
- Mobile-first design with swipeable meal cards.
- Macro progress bars in clear colors (Protein = blue, Carbs = orange, Fat = yellow, Fiber = green).
- Smooth animations when adding/removing food.