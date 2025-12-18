import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization token from the request header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if user document exists
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      return NextResponse.json({
        message: 'User document already exists',
        userId
      }, { status: 200 });
    }

    // Get user info from Firebase Auth
    const userRecord = await adminAuth.getUser(userId);

    // Create the missing user document
    await userDocRef.set({
      id: userId,
      name: userRecord.displayName || userRecord.email?.split('@')[0] || 'Utilisateur',
      email: userRecord.email || '',
      role: 'PATRON',
      avatar: userRecord.photoURL || `https://picsum.photos/seed/${userId}/100/100`,
      phoneNumber: userRecord.phoneNumber || '',
    });

    return NextResponse.json({
      message: 'User document created successfully',
      userId
    }, { status: 200 });

  } catch (error: any) {
    console.error('[fix-user-doc] Error:', error);
    return NextResponse.json({
      message: 'Failed to fix user document',
      error: error.message
    }, { status: 500 });
  }
}
