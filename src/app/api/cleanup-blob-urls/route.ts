import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

    // Check if user is a PATRON (admin)
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'PATRON') {
      return NextResponse.json({ message: 'Forbidden - PATRON role required' }, { status: 403 });
    }

    // Get all users
    const usersSnapshot = await adminDb.collection('users').get();

    let cleanedCount = 0;
    const cleanedDocs: string[] = [];

    // For each user, check their recaps
    for (const userDoc of usersSnapshot.docs) {
      const recapsSnapshot = await adminDb
        .collection('users')
        .doc(userDoc.id)
        .collection('recaps')
        .get();

      for (const recapDoc of recapsSnapshot.docs) {
        const data = recapDoc.data();

        // Check if mediaUrl starts with 'blob:'
        if (data.mediaUrl && data.mediaUrl.startsWith('blob:')) {
          // Remove the invalid mediaUrl and mediaType fields
          await recapDoc.ref.update({
            mediaUrl: FieldValue.delete(),
            mediaType: FieldValue.delete()
          });

          cleanedCount++;
          cleanedDocs.push(`users/${userDoc.id}/recaps/${recapDoc.id}`);
        }
      }
    }

    return NextResponse.json({
      message: `Cleanup completed. ${cleanedCount} document(s) cleaned.`,
      cleanedDocs
    }, { status: 200 });

  } catch (error: any) {
    console.error('[cleanup-blob-urls] Error:', error);
    return NextResponse.json({
      message: 'Failed to cleanup blob URLs',
      error: error.message
    }, { status: 500 });
  }
}
