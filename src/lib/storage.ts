import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload files to Firebase Storage and return their download URLs
 * @param files Array of File objects to upload
 * @param userId User ID for organizing storage
 * @param folder Folder name (e.g., 'receipts', 'documents')
 * @returns Promise resolving to array of download URLs
 */
export async function uploadFiles(
  files: File[],
  userId: string,
  folder: string
): Promise<string[]> {
  if (files.length === 0) return [];

  const storage = getStorage();
  const uploadPromises = files.map(async (file) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const storageRef = ref(storage, `${userId}/${folder}/${fileName}`);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  });

  return Promise.all(uploadPromises);
}
