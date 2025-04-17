// src/services/userService.ts
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/firebase/config';

interface NewUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatarUrl?: string;
  role: string; // Added role field
}

export const userService = {
  createUser: async (userData: NewUserData) => {
    try {
      // Call backend API to create the user in Firebase Auth
      const res = await fetch('/api/createUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        let errorMessage = 'Failed to create user';
        try {
          const error = await res.json();
          errorMessage = error.error || errorMessage;
        } catch (err) {
          console.error('Non-JSON error response from server');
        }
        throw new Error(errorMessage);
      }      

      const { uid } = await res.json();

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', uid), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        email: userData.email,
        role: userData.role,
        createdAt: new Date().toISOString(),
      });

      return uid;
    } catch (error: any) {
      // Handle specific Firebase error codes
      if (error.message.includes('The email address is already in use by another account.')) {
        throw new Error('This email is already registered');
      }

      // Fallback for other errors (only if the specific error wasn't thrown)
      console.error('Error creating user:', error);
      throw new Error('Failed to create user. Please try again.');
    }
  }
};

//'auth/email-already-in-use'

import { onAuthStateChanged } from 'firebase/auth';

export const getUserProfile = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<NewUserData>) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};
