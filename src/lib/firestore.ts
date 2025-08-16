import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestoreInstance, getStorageInstance } from './firebase';
import type { UserProfile, Goals, Meal, FoodItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function createUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
  try {
    const db = getFirestoreInstance();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const defaultGoals: Goals = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 67,
        fiber: 25,
      };
      
      const newUserProfile: UserProfile = {
        uid: userId,
        email: userData.email || null,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        goals: userData.goals || defaultGoals,
      };
      
      await setDoc(userDocRef, newUserProfile);
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  try {
    const db = getFirestoreInstance();
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const db = getFirestoreInstance();
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

export async function addMeal(mealData: Omit<Meal, 'id' | 'createdAt'>, imageFile?: File): Promise<string> {
  try {
    console.log('🔍 Firestore - Starting addMeal function...');
    console.log('🔍 Firestore - Meal data received:', mealData);
    console.log('🔍 Firestore - Image file:', imageFile);
    
    const storage = getStorageInstance();
    const db = getFirestoreInstance();
    
    console.log('🔍 Firestore - Got storage and db instances');
    
    let photoUrl: string | undefined;
    
    if (imageFile) {
      console.log('🔍 Firestore - Processing image file...');
      const storageRef = ref(storage, `meals/${mealData.userId}/${uuidv4()}`);
      console.log('🔍 Firestore - Storage ref created:', storageRef);
      const snapshot = await uploadBytes(storageRef, imageFile);
      console.log('🔍 Firestore - Image uploaded, getting download URL...');
      photoUrl = await getDownloadURL(snapshot.ref);
      console.log('🔍 Firestore - Photo URL obtained:', photoUrl);
    } else {
      console.log('🔍 Firestore - No image file, skipping image processing');
    }
    
    const mealWithId: Meal = {
      ...mealData,
      id: uuidv4(),
      createdAt: Date.now(),
      photoUrl,
    };
    
    console.log('🔍 Firestore - Meal with ID created:', mealWithId);
    console.log('🔍 Firestore - Adding to Firestore collection...');
    
    const docRef = await addDoc(collection(db, 'meals'), mealWithId);
    
    console.log('✅ Firestore - Meal document created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Firestore - Error adding meal:', error);
    console.error('❌ Firestore - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any).code,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    throw error;
  }
}

export async function getMealsForDay(userId: string, date: Date): Promise<Meal[]> {
  try {
    const db = getFirestoreInstance();
    const dateString = date.toISOString().split('T')[0];
    
    console.log('📅 Firestore - Fetching meals for date:', dateString, 'user:', userId);
    
    // Restored optimized query with proper index
    const mealsQuery = query(
      collection(db, 'meals'),
      where('userId', '==', userId),
      where('date', '==', dateString),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(mealsQuery);
    const meals: Meal[] = [];
    
    querySnapshot.forEach((doc) => {
      meals.push(doc.data() as Meal);
    });
    
    console.log('✅ Firestore - Fetched meals:', meals.length);
    return meals;
  } catch (error) {
    console.error('❌ Firestore - Error getting meals for day:', error);
    throw error;
  }
}

export async function deleteMeal(mealId: string, userId: string): Promise<void> {
  try {
    const db = getFirestoreInstance();
    const storage = getStorageInstance();
    
    // Get the meal to check if it has a photo
    const mealQuery = query(
      collection(db, 'meals'),
      where('id', '==', mealId),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs( mealQuery);
    if (!querySnapshot.empty) {
      const mealDoc = querySnapshot.docs[0];
      const mealData = mealDoc.data() as Meal;
      
      // Delete the photo from storage if it exists
      if (mealData.photoUrl) {
        try {
          const photoRef = ref(storage, mealData.photoUrl);
          await deleteObject(photoRef);
        } catch (storageError) {
          console.warn('Error deleting photo from storage:', storageError);
        }
      }
      
      // Delete the meal document
      await deleteDoc(mealDoc.ref);
    }
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
}


export const updateUserGoals = async (userId: string, goals: Goals) => {
  try {
    const db = getFirestoreInstance();
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { goals });
  } catch (error) {
    console.error('Error updating user goals:', error);
    throw error;
  }
};

export const getWeeklyTrends = async (userId: string) => {
  try {
    const db = getFirestoreInstance();
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    weekAgo.setHours(0,0,0,0);

    console.log('📊 Firestore - Fetching weekly trends for user:', userId);

    // Restored optimized query with proper index
    const q = query(
      collection(db, 'meals'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(weekAgo)),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const meals = querySnapshot.docs.map(doc => doc.data() as Meal);
    
    console.log('📊 Firestore - Fetched meals for weekly trends:', meals.length);
    
    // Aggregate by day
    const dailyData: { [key: string]: { calories: number, protein: number, carbs: number, fat: number, fiber: number } } = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo);
      d.setDate(weekAgo.getDate() + i);
      const dateString = d.toISOString().split('T')[0];
      dailyData[dateString] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    }
    
    meals.forEach(meal => {
      // Handle both timestamp and number types for createdAt
      let mealDate: string;
      if (typeof meal.createdAt === 'number') {
        mealDate = new Date(meal.createdAt).toISOString().split('T')[0];
      } else {
        mealDate = (meal.createdAt as Timestamp).toDate().toISOString().split('T')[0];
      }
      
      if (dailyData[mealDate]) {
          dailyData[mealDate].calories += meal.totals.calories;
          dailyData[mealDate].protein += meal.totals.protein;
          dailyData[mealDate].carbs += meal.totals.carbs;
          dailyData[mealDate].fat += meal.totals.fat;
          dailyData[mealDate].fiber += meal.totals.fiber;
      }
    });

    const result = Object.entries(dailyData).map(([date, totals]) => ({
      date,
      ...totals
    }));
    
    console.log('✅ Firestore - Weekly trends calculated:', result.length, 'days');
    return result;
  } catch (error) {
    console.error('❌ Firestore - Error getting weekly trends:', error);
    throw error;
  }
};
    