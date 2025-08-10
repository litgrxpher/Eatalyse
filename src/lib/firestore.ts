import { db, storage } from '@/lib/firebase';
import type { Meal, Goals } from '@/types';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export const createUserProfile = async (
  uid: string,
  email: string | null,
  displayName: string | null
) => {
  const userDocRef = doc(db, 'users', uid);
  const defaultGoals: Goals = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 60,
    fiber: 30,
  };
  await setDoc(userDocRef, {
    uid,
    email,
    displayName,
    goals: defaultGoals,
    createdAt: serverTimestamp(),
  });
};

export const addMeal = async (mealData: Omit<Meal, 'id' | 'createdAt'>, imageFile?: File) => {
  let photoUrl = '';
  if (imageFile) {
    const storageRef = ref(storage, `meals/${mealData.userId}/${uuidv4()}`);
    const snapshot = await uploadBytes(storageRef, imageFile);
    photoUrl = await getDownloadURL(snapshot.ref);
  }

  await addDoc(collection(db, 'meals'), {
    ...mealData,
    photoUrl: photoUrl || mealData.photoUrl || '',
    createdAt: serverTimestamp(),
  });
};

export const getMealsForDay = async (userId: string, date: Date): Promise<Meal[]> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    collection(db, 'meals'),
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
    where('createdAt', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meal));
};


export const updateUserGoals = async (userId: string, goals: Goals) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { goals });
};

export const getWeeklyTrends = async (userId: string) => {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  weekAgo.setHours(0,0,0,0);

  const q = query(
    collection(db, 'meals'),
    where('userId', '==', userId),
    where('createdAt', '>=', Timestamp.fromDate(weekAgo)),
    orderBy('createdAt', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const meals = querySnapshot.docs.map(doc => doc.data() as Meal);
  
  // Aggregate by day
  const dailyData: { [key: string]: { calories: number, protein: number, carbs: number, fat: number, fiber: number } } = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo);
    d.setDate(weekAgo.getDate() + i);
    const dateString = d.toISOString().split('T')[0];
    dailyData[dateString] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }
  
  meals.forEach(meal => {
    // Firestore timestamp to JS Date, then to YYYY-MM-DD string
    const mealDate = (meal.createdAt as unknown as Timestamp).toDate().toISOString().split('T')[0];
    if (dailyData[mealDate]) {
        dailyData[mealDate].calories += meal.totals.calories;
        dailyData[mealDate].protein += meal.totals.protein;
        dailyData[mealDate].carbs += meal.totals.carbs;
        dailyData[mealDate].fat += meal.totals.fat;
        dailyData[mealDate].fiber += meal.totals.fiber;
    }
  });

  return Object.entries(dailyData).map(([date, totals]) => ({
    date,
    ...totals
  }));
};
