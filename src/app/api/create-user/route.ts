
import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize the Admin SDK only if it hasn't been initialized
if (!admin.apps.length) {
  // The service account is automatically available in the App Hosting environment
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const managerUid = decodedToken.uid;

    const managerDoc = await db.collection('users').doc(managerUid).get();
    if (!managerDoc.exists || managerDoc.data()?.role !== 'PATRON') {
        return NextResponse.json({ message: 'Forbidden: Only PATRON can create users.' }, { status: 403 });
    }
    
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }
    
    // Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Create the user profile in Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      id: userRecord.uid,
      name,
      email,
      role: 'RESPONSABLE',
      managerId: managerUid,
      avatar: `https://picsum.photos/seed/${userRecord.uid}/100/100`,
      phoneNumber: '',
    });

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    let message = 'Internal Server Error';
    if (error.code === 'auth/email-already-exists') {
        message = 'Cette adresse email est déjà utilisée.';
    } else if (error.code === 'auth/invalid-password') {
        message = 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    return NextResponse.json({ message: message }, { status: 500 });
  }
}
