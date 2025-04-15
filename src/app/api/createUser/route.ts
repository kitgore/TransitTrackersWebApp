// src/app/api/createUser/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { cert, getApps, initializeApp } from 'firebase-admin/app';

if (!getApps().length) {
    try {
      console.log('Initializing Firebase Admin SDK...');
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin initialized successfully.');
    } catch (err) {
      console.error('🔥 Firebase Admin SDK failed to initialize:', err);
    }
  }
  
export async function POST(req: Request) {
  try {
    console.log("Route Reached");
    const body = await req.json();
    const { email, password, firstName, lastName, phoneNumber, role } = body;

    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: phoneNumber || undefined,
    });

    if (role) {
      await getAuth().setCustomUserClaims(userRecord.uid, { role });
    }

    return NextResponse.json({ message: 'User created successfully', uid: userRecord.uid });
  } catch (error: any) {
    console.error('[CREATE_USER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
