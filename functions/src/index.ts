import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Helper function to send notification
async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: fcmToken,
    };

    await messaging.send(message);
    console.log(`Notification sent to user ${userId}`);

    // Also create in-app notification
    await db.collection('users').doc(userId).collection('notifications').add({
      title,
      body,
      type: data?.type || 'GENERAL',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      data: data || {},
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// Trigger when a transaction is created
export const onTransactionCreated = functions.firestore
  .document('users/{userId}/transactions/{transactionId}')
  .onCreate(async (snapshot, context) => {
    const transaction = snapshot.data();
    const userId = context.params.userId;

    // Only notify for expenses
    if (transaction.type !== 'EXPENSE') {
      // If it's a budget add, notify the RESPONSABLE
      if (transaction.type === 'BUDGET_ADD') {
        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();

        if (user?.role === 'RESPONSABLE' && user?.managerId) {
          await sendNotification(
            userId,
            '💵 Budget ajouté',
            `${transaction.amount} ${transaction.currency} ont été ajoutés à votre budget`,
            {
              type: 'BUDGET_ADDED',
              amount: transaction.amount.toString(),
              currency: transaction.currency,
            }
          );
        }
      }
      return;
    }

    // Get the user who created the expense
    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    if (!user) return;

    // If user is RESPONSABLE, notify their manager (PATRON)
    if (user.role === 'RESPONSABLE' && user.managerId) {
      await sendNotification(
        user.managerId,
        '💰 Nouvelle dépense',
        `${user.name} a enregistré une dépense de ${transaction.amount} ${transaction.currency}: ${transaction.reason}`,
        {
          type: 'EXPENSE_ADDED',
          userName: user.name,
          amount: transaction.amount.toString(),
          currency: transaction.currency,
          reason: transaction.reason,
        }
      );
    }
  });

// Trigger when a recap is created
export const onRecapCreated = functions.firestore
  .document('users/{userId}/recaps/{recapId}')
  .onCreate(async (snapshot, context) => {
    const recap = snapshot.data();
    const userId = context.params.userId;

    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    if (!user) return;

    // If user is RESPONSABLE, notify their manager
    if (user.role === 'RESPONSABLE' && user.managerId) {
      await sendNotification(
        user.managerId,
        '📋 Nouveau rapport',
        `${user.name} a publié un rapport d'activité: ${recap.title}`,
        {
          type: 'RECAP_ADDED',
          userName: user.name,
          title: recap.title,
        }
      );
    }
  });

// Trigger when a mission status changes to DONE
export const onMissionUpdated = functions.firestore
  .document('users/{userId}/missions/{missionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = context.params.userId;

    // Check if mission was just completed
    if (before.status !== 'DONE' && after.status === 'DONE') {
      const userDoc = await db.collection('users').doc(userId).get();
      const user = userDoc.data();

      if (!user) return;

      // If user is RESPONSABLE, notify their manager
      if (user.role === 'RESPONSABLE' && user.managerId) {
        await sendNotification(
          user.managerId,
          '✅ Mission terminée',
          `${user.name} a terminé la mission: ${after.title}`,
          {
            type: 'MISSION_COMPLETED',
            userName: user.name,
            missionTitle: after.title,
          }
        );
      }
    }
  });

// Trigger when a mission is created with SHARED type
export const onMissionCreated = functions.firestore
  .document('users/{userId}/missions/{missionId}')
  .onCreate(async (snapshot, context) => {
    const mission = snapshot.data();
    const userId = context.params.userId;

    // Only notify for SHARED missions
    if (mission.type !== 'SHARED') return;

    const userDoc = await db.collection('users').doc(userId).get();
    const user = userDoc.data();

    if (!user) return;

    // If creator is PATRON, notify their collaborators
    if (user.role === 'PATRON') {
      const collaboratorsSnapshot = await db
        .collection('users')
        .where('managerId', '==', userId)
        .get();

      const notifications = collaboratorsSnapshot.docs.map((doc) =>
        sendNotification(
          doc.id,
          '🎯 Nouvelle mission',
          `Vous avez une nouvelle mission: ${mission.title}`,
          {
            type: 'MISSION_ASSIGNED',
            missionTitle: mission.title,
          }
        )
      );

      await Promise.all(notifications);
    }
  });

// Scheduled function to check for mission reminders (runs every hour)
export const checkMissionReminders = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    // This is a simplified version - you would need to add a dueDate field to missions
    console.log('Checking for mission reminders...');
    // Implementation would query missions with dueDate within the next hour
    // and send reminders to the assignees
  });

// Emergency function to create missing user documents
// Call this via: https://REGION-PROJECT.cloudfunctions.net/createMissingUserDoc?userId=USER_ID
export const createMissingUserDoc = functions.https.onRequest(async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).send('Missing userId parameter');
      return;
    }

    // Check if document already exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      res.status(200).json({ message: 'User document already exists', userId });
      return;
    }

    // Get user info from Auth
    const userRecord = await admin.auth().getUser(userId);

    // Create the document
    await db.collection('users').doc(userId).set({
      id: userId,
      name: userRecord.displayName || userRecord.email?.split('@')[0] || 'Utilisateur',
      email: userRecord.email || '',
      role: 'PATRON',
      avatar: userRecord.photoURL || `https://picsum.photos/seed/${userId}/100/100`,
      phoneNumber: userRecord.phoneNumber || '',
    });

    res.status(200).json({
      message: 'User document created successfully',
      userId,
      userData: {
        name: userRecord.displayName || userRecord.email?.split('@')[0],
        email: userRecord.email
      }
    });
  } catch (error: any) {
    console.error('Error creating user document:', error);
    res.status(500).json({ error: error.message });
  }
});
