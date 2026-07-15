import fs from 'fs';
import path from 'path';

// Helper to query Google Drive files
async function driveRequest(accessToken: string, endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `https://www.googleapis.com${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// 1. Find or create a folder in Google Drive
export async function findOrCreateFolder(accessToken: string, folderName: string, parentId?: string): Promise<string> {
  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const encodedQuery = encodeURIComponent(query);
  const searchResult = await driveRequest(accessToken, `/drive/v3/files?q=${encodedQuery}&fields=files(id)`);
  
  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id;
  }

  // Create folder
  const createResult = await driveRequest(accessToken, '/drive/v3/files', {
    method: 'POST',
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    })
  });

  return createResult.id;
}

// 2. Upload a file (metadata + content media upload)
export async function uploadFileToDrive(
  accessToken: string,
  filename: string,
  mimeType: string,
  content: string | Buffer,
  parentId?: string
): Promise<string> {
  // Step 1: Create metadata entry
  const metadata = await driveRequest(accessToken, '/drive/v3/files', {
    method: 'POST',
    body: JSON.stringify({
      name: filename,
      parents: parentId ? [parentId] : undefined
    })
  });

  const fileId = metadata.id;

  // Step 2: Upload raw media content
  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
  
  const response = await fetch(uploadUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': mimeType
    },
    body: content
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive media upload failed (${response.status}): ${errorText}`);
  }

  return fileId;
}

// 3. Check if a specific file name exists in a parent folder
export async function checkFileExists(accessToken: string, filename: string, parentId: string): Promise<string | null> {
  const query = `name = '${filename}' and '${parentId}' in parents and trashed = false`;
  const encodedQuery = encodeURIComponent(query);
  const searchResult = await driveRequest(accessToken, `/drive/v3/files?q=${encodedQuery}&fields=files(id)`);
  
  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id;
  }
  return null;
}

// 4. List all files (backups) in a folder
export async function listFilesInFolder(accessToken: string, folderId: string) {
  const query = `'${folderId}' in parents and trashed = false`;
  const encodedQuery = encodeURIComponent(query);
  const result = await driveRequest(accessToken, `/drive/v3/files?q=${encodedQuery}&orderBy=createdTime desc&fields=files(id,name,mimeType,createdTime,size)`);
  return result.files || [];
}
