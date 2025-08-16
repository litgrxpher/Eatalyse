
import { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, deleteDoc, updateDoc, Timestamp, writeBatch, limit } from 'firebase/firestore';
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

export async function addMeal(mealData: Omit<Meal, 'id' | 'createdAt' | 'photoUrl'>, imageFile?: File): Promise<string> {
  try {
    const storage = getStorageInstance();
    const db = getFirestoreInstance();
    
    const docId = uuidv4();
    
    const mealToSave: Partial<Meal> = {
      ...mealData,
      id: docId,
      createdAt: Date.now(),
    };
    
    if (imageFile) {
      const storageRef = ref(storage, `meals/${mealData.userId}/${docId}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      mealToSave.photoUrl = await getDownloadURL(snapshot.ref);
    }
    
    await setDoc(doc(db, 'meals', docId), mealToSave);
    
    return docId;
  } catch (error) {
    console.error('❌ Firestore - Error adding meal:', error);
    throw error;
  }
}


export async function updateMeal(mealId: string, updates: Partial<Meal>): Promise<void> {
  try {
    const db = getFirestoreInstance();
    const mealDocRef = doc(db, 'meals', mealId);
    
    const dataToUpdate = {
      ...updates,
      id: mealId,
    };

    await updateDoc(mealDocRef, dataToUpdate);
  } catch (error) {
    console.error('Error updating meal:', error);
    throw error;
  }
}


export async function getMealsForDay(userId: string, date: Date): Promise<Meal[]> {
  try {
    const db = getFirestoreInstance();
    const dateString = date.toISOString().split('T')[0];
    
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
    
    const mealDocRef = doc(db, 'meals', mealId);
    const mealDoc = await getDoc(mealDocRef);

    if (!mealDoc.exists() || mealDoc.data().userId !== userId) {
        throw new Error("Meal not found or permission denied.");
    }
    
    const mealData = mealDoc.data() as Meal;
      
    if (mealData.photoUrl) {
      try {
        const photoRef = ref(storage, mealData.photoUrl);
        await deleteObject(photoRef);
        console.log('Photo deleted from storage successfully.');
      } catch (storageError: any) {
        if (storageError.code !== 'storage/object-not-found') {
          console.warn('Could not delete photo from storage, but proceeding to delete Firestore document:', storageError);
        }
      }
    }

    await deleteDoc(mealDocRef);
    console.log('Meal document deleted from Firestore successfully.');

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

    const q = query(
      collection(db, 'meals'),
      where('userId', '==', userId),
      where('createdAt', '>=', weekAgo.getTime()),
      orderBy('userId', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const meals = querySnapshot.docs.map(doc => doc.data() as Meal);
    
    const dailyData: { [key: string]: { calories: number, protein: number, carbs: number, fat: number, fiber: number } } = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      dailyData[dateString] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    }
    
    meals.forEach(meal => {
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
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return result;
  } catch (error) {
    console.error('❌ Firestore - Error getting weekly trends:', error);
    throw error;
  }
};
    