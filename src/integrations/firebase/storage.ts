/**
 * ShadowTalk AI — Firebase Storage Integration
 * 
 * Used for: avatar uploads, file attachments, exported documents,
 * and any user-generated content that needs fast CDN delivery.
 */

import {
  storage,
  isFirebaseConfigured,
  fbStorageRef,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from './client';

// ============================================================
// Upload helpers
// ============================================================

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  progress?: number; // 0-100, only during upload
}

/** Upload a file (non-resumable, for small files < 10MB) */
export async function uploadFile(
  bucketPath: string,
  file: File | Blob,
  metadata?: { contentType?: string; customMetadata?: Record<string, string> }
): Promise<UploadResult> {
  if (!isFirebaseConfigured) return { success: false, error: 'Firebase not configured' };

  try {
    const ref = fbStorageRef(storage as any, bucketPath);
    await uploadBytes(ref, file, metadata);
    const url = await getDownloadURL(ref);
    return { success: true, url, path: bucketPath };
  } catch (err: any) {
    console.error(`[Firebase Storage] Upload ${bucketPath} failed:`, err);
    return { success: false, error: err?.message || 'Upload failed' };
  }
}

/** Upload with progress callback (resumable, for large files) */
export function uploadFileResumable(
  bucketPath: string,
  file: File | Blob,
  onProgress?: (progress: number) => void,
  metadata?: { contentType?: string }
): Promise<UploadResult> {
  if (!isFirebaseConfigured) return Promise.resolve({ success: false, error: 'Firebase not configured' });

  return new Promise((resolve) => {
    const ref = fbStorageRef(storage as any, bucketPath);
    const task = uploadBytesResumable(ref, file, metadata);

    task.on('state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress?.(pct);
      },
      (error) => {
        console.error(`[Firebase Storage] Resumable upload ${bucketPath} failed:`, error);
        resolve({ success: false, error: error?.message || 'Upload failed' });
      },
      async () => {
        try {
          const url = await getDownloadURL(ref);
          resolve({ success: true, url, path: bucketPath, progress: 100 });
        } catch (err: any) {
          resolve({ success: false, error: err?.message || 'Failed to get download URL' });
        }
      }
    );
  });
}

// ============================================================
// Download / Delete
// ============================================================

export async function getPublicUrl(bucketPath: string): Promise<string | null> {
  if (!isFirebaseConfigured) return null;
  try {
    return await getDownloadURL(fbStorageRef(storage as any, bucketPath));
  } catch (err) {
    console.warn(`[Firebase Storage] getURL ${bucketPath} failed:`, err);
    return null;
  }
}

export async function deleteFile(bucketPath: string): Promise<boolean> {
  if (!isFirebaseConfigured) return false;
  try {
    await deleteObject(fbStorageRef(storage as any, bucketPath));
    return true;
  } catch (err) {
    console.warn(`[Firebase Storage] delete ${bucketPath} failed:`, err);
    return false;
  }
}

export async function listFiles(bucketPath: string): Promise<Array<{ name: string; url: string }>> {
  if (!isFirebaseConfigured) return [];
  try {
    const result = await listAll(fbStorageRef(storage as any, bucketPath));
    const urls = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return { name: item.name, url };
      })
    );
    return urls;
  } catch (err) {
    console.warn(`[Firebase Storage] list ${bucketPath} failed:`, err);
    return [];
  }
}

// ============================================================
// ShadowTalk-specific paths
// ============================================================

export const STORAGE_PATHS = {
  avatar: (userId: string) => `avatars/${userId}`,
  avatarThumbnail: (userId: string) => `avatars/thumbnails/${userId}`,
  chatAttachment: (chatId: string, fileName: string) => `chats/${chatId}/${Date.now()}_${fileName}`,
  workspaceLogo: (workspaceId: string) => `workspaces/${workspaceId}/logo`,
  export: (userId: string, fileName: string) => `exports/${userId}/${Date.now()}_${fileName}`,
  sharedAnswer: (answerId: string, fileName: string) => `shared/${answerId}/${fileName}`,
  agentAsset: (agentId: string, fileName: string) => `marketplace/${agentId}/${fileName}`,
} as const;
