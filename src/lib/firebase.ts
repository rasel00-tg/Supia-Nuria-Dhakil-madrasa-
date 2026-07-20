import { initializeApp } from "firebase/app";
import { initializeFirestore, Query, onSnapshot, DocumentData, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import React, { useEffect, useState, ReactNode } from "react";
import { loadingService } from "./loadingService";

const firebaseConfig = {
  apiKey: "AIzaSyDNHlCGJn-UxfCfV00dEIlEEFej4EOvwhE",
  authDomain: "model-outrider-pn50x.firebaseapp.com",
  projectId: "model-outrider-pn50x",
  // Standard bucket in gs:// format is supported or URL format
  storageBucket: "model-outrider-pn50x.firebasestorage.app",
  messagingSenderId: "66901622784",
  appId: "1:66901622784:web:bad39e517352c1a4de98e5"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling enabled to bypass websocket/proxy blockages in sandboxed iframe environment
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-cd3763db-984b-4a51-9a2b-e448ca0250a9");

// Enable offline persistence for better performance when re-connecting or minimizing the app
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn("Firestore persistence failed: multiple tabs open");
    } else if (err.code === 'unimplemented-state') {
      // The current browser does not support all of the features required to enable persistence
      console.warn("Firestore persistence failed: browser not supported");
    }
  });
}

// Export Firebase Storage instance initialized with proper storage bucket config
export const storage = getStorage(app);

// Removed uploadFileToStorage

import imageCompression from 'browser-image-compression';

/**
 * Uploads an image file to ImgBB and returns the public direct image URL.
 * It automatically compresses the image to a smaller size (e.g., max 300KB) before uploading.
 */
export async function uploadFileToImgBB(file: File): Promise<string> {
  const IMGBB_API_KEY = "96be92cf24f1281697cde3f7ad9d506e";
  try {
    // Auto-compress image before uploading
    const options = {
      maxSizeMB: 0.3, // 300 KB max
      maxWidthOrHeight: 1200,
      useWebWorker: true
    };
    
    let compressedFile: File;
    if (file.type.startsWith('image/')) {
      const blob = await imageCompression(file, options);
      compressedFile = new File([blob], file.name, { type: file.type });
    } else {
      compressedFile = file; // Fallback if not an image (though ImgBB expects images)
    }

    const formData = new FormData();
    formData.append("image", compressedFile);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ImgBB HTTP error! Status: ${response.status}`);
    }

    const json = await response.json();
    if (json && json.success && json.data && json.data.url) {
      return json.data.url;
    } else {
      throw new Error(json?.error?.message || "ImgBB response was not successful");
    }
  } catch (error) {
    console.error("ImgBB Upload Error:", error);
    throw error;
  }
}

/**
 * Converts a gs:// URI (e.g. gs://model-outrider-pn50x.appspot.com/teachers/logo.png)
 * to a dynamic public HTTP download URL.
 */
export function getHttpUrlFromGsUri(gsUri: string): string {
  if (!gsUri || !gsUri.startsWith("gs://")) return gsUri;
  
  try {
    const withoutProtocol = gsUri.substring(5); // "bucket-name/path/to/file"
    const firstSlashIndex = withoutProtocol.indexOf("/");
    if (firstSlashIndex === -1) return gsUri;
    
    const bucketName = withoutProtocol.substring(0, firstSlashIndex);
    const filePath = withoutProtocol.substring(firstSlashIndex + 1);
    const encodedFilePath = encodeURIComponent(filePath);
    
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedFilePath}?alt=media`;
  } catch (error) {
    console.error("Error converting GS URI to HTTP:", error);
    return gsUri;
  }
}

/**
 * Converts a public HTTP Firebase Storage URL back to a gs:// URI.
 */
export function getGsUriFromHttpUrl(httpUrl: string): string {
  if (!httpUrl || !httpUrl.includes("firebasestorage.googleapis.com")) return httpUrl;
  
  try {
    const parts = httpUrl.split("/o/");
    if (parts.length < 2) return httpUrl;
    
    const preO = parts[0];
    const postO = parts[1].split("?")[0];
    
    const bucketParts = preO.split("/b/");
    if (bucketParts.length < 2) return httpUrl;
    
    const bucketName = bucketParts[1];
    const filePath = decodeURIComponent(postO);
    
    return `gs://${bucketName}/${filePath}`;
  } catch (error) {
    console.error("Error converting HTTP URL to GS URI:", error);
    return httpUrl;
  }
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface StreamBuilderProps<T> {
  stream: Query<DocumentData>;
  builder: (data: T[], loading: boolean, error: any) => ReactNode;
  loadingNode?: ReactNode;
}

// Global cache to store stream documents and avoid blank flashes on navigation or updates
const streamCache = new Map<string, any>();

function getQueryCacheKey(query: any): string {
  if (!query) return "";
  try {
    const q = query._query || query;
    const path = q.path?.toString() || "";
    const filters = q.filters?.map((f: any) => {
      const field = f.field?.toString() || f.fieldPath?.toString() || "";
      const op = f.op || f.operator || "";
      const val = f.value?.toString() || f.value?.localId || JSON.stringify(f.value || "");
      return `${field}:${op}:${val}`;
    }).join(",") || "";
    const orders = q.explicitOrderBy?.map((o: any) => {
      const field = o.field?.toString() || o.fieldPath?.toString() || "";
      const dir = o.dir || o.direction || "";
      return `${field}:${dir}`;
    }).join(",") || "";
    const limitVal = q.limit !== undefined ? q.limit : "";
    return `${path}|filters:${filters}|orders:${orders}|limit:${limitVal}`;
  } catch (e) {
    return String(query.path || query.toString?.() || "");
  }
}

export function StreamBuilder<T>({ stream, builder, loadingNode }: StreamBuilderProps<T>) {
  const cacheKey = getQueryCacheKey(stream);

  // Initialize with cached data if available for instant UI rendering without any flickers
  const [data, setData] = useState<T[]>(() => {
    if (cacheKey && streamCache.has(cacheKey)) {
      return streamCache.get(cacheKey);
    }
    return [];
  });

  const [loading, setLoading] = useState(() => {
    if (cacheKey && streamCache.has(cacheKey)) {
      return false;
    }
    return true;
  });

  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const hasCache = cacheKey && streamCache.has(cacheKey);

    if (!hasCache) {
      setLoading(true);
      loadingService.show();
    }

    let hasDecremented = false;

    const unsubscribe = onSnapshot(
      stream,
      (snapshot) => {
        if (!active) return;
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });

        if (cacheKey) {
          streamCache.set(cacheKey, items);
        }

        setData(items);
        setLoading(false);

        if (!hasDecremented) {
          hasDecremented = true;
          if (!hasCache) {
            loadingService.hide();
          }
        }
      },
      (err) => {
        if (!active) return;
        console.error("StreamBuilder Error:", err);
        setError(err);
        setLoading(false);

        if (!hasDecremented) {
          hasDecremented = true;
          if (!hasCache) {
            loadingService.hide();
          }
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
      if (!hasDecremented) {
        hasDecremented = true;
        if (!hasCache) {
          loadingService.hide();
        }
      }
    };
  }, [stream, cacheKey]);

  if (loading && data.length === 0 && loadingNode) {
    return React.createElement(React.Fragment, null, loadingNode);
  }

  return React.createElement(React.Fragment, null, builder(data, loading, error));
}

