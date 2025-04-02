// src/services/userService.ts
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/src/firebase/config';

interface NewUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string; // Added role field
}

export const userService = {
  createUser: async (userData: NewUserData) => {
    try {
      // Create authentication user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        email: userData.email,
        role: userData.role, // Ensure role is stored in Firestore
        createdAt: new Date().toISOString(),
      });

      return userCredential.user;
    } catch (error: any) {
      // Handle specific Firebase error codes
      const errorCode = error.code;
      switch (errorCode) {
        case 'auth/email-already-in-use':
          throw new Error('This email is already registered');
        case 'auth/invalid-email':
          throw new Error('Invalid email address');
        case 'auth/operation-not-allowed':
          throw new Error('Email/password accounts are not enabled. Please contact support.');
        case 'auth/weak-password':
          throw new Error('Password is too weak. Must be at least 6 characters');
        default:
          console.error('Error creating user:', error);
          throw new Error('Failed to create user. Please try again.');
      }
    }
  }
};
