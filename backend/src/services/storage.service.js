import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

// Storage abstraction — confidential documents are never served from a public
// static path. Flip STORAGE_PROVIDER env to switch providers with no controller
// changes: 'local' (disk) | 'supabase' | 'spaces' (DigitalOcean / S3).

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsBaseDir = path.resolve(__dirname, '../../uploads');

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ---------------------------------------------------------------------------
// Local disk provider
// ---------------------------------------------------------------------------
const localProvider = {
  name: 'local',
  async save({ buffer, employeeId, originalName, timestamp }) {
    const storedName = `${timestamp}-${sanitizeName(originalName)}`;
    const employeeDir = path.join(uploadsBaseDir, 'employee-documents', String(employeeId));
    await fs.mkdir(employeeDir, { recursive: true });
    await fs.writeFile(path.join(employeeDir, storedName), buffer);
    const relativePath = path.posix.join('employee-documents', String(employeeId), storedName);
    return { storedName, relativePath, storageProvider: 'local' };
  },
  async read(relativePath) {
    const absolutePath = path.resolve(uploadsBaseDir, relativePath);
    // Guard against path traversal outside the uploads root.
    if (!absolutePath.startsWith(uploadsBaseDir)) {
      throw new Error('Invalid file path');
    }
    return fs.readFile(absolutePath);
  },
  async remove(relativePath) {
    const absolutePath = path.resolve(uploadsBaseDir, relativePath);
    if (!absolutePath.startsWith(uploadsBaseDir)) return;
    await fs.rm(absolutePath, { force: true });
  },
  // Local files have no signed URL; callers fall back to the authenticated route.
  async signedUrl() {
    return null;
  }
};

// ---------------------------------------------------------------------------
// DigitalOcean Spaces provider (S3-compatible) — activated when configured.
// Lazy-loads @aws-sdk/client-s3 so the dependency is only needed in the cloud.
// ---------------------------------------------------------------------------
function createSpacesProvider() {
  let clientPromise = null;

  async function getClient() {
    if (!clientPromise) {
      clientPromise = (async () => {
        const { S3Client } = await import('@aws-sdk/client-s3');
        return new S3Client({
          endpoint: env.spaces.endpoint,
          region: env.spaces.region || 'us-east-1',
          credentials: { accessKeyId: env.spaces.key, secretAccessKey: env.spaces.secret }
        });
      })();
    }
    return clientPromise;
  }

  return {
    name: 'spaces',
    async save({ buffer, employeeId, originalName, timestamp, mimeType }) {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await getClient();
      const storedName = `${timestamp}-${sanitizeName(originalName)}`;
      const relativePath = `employee-documents/${employeeId}/${storedName}`;
      await client.send(
        new PutObjectCommand({
          Bucket: env.spaces.bucket,
          Key: relativePath,
          Body: buffer,
          ContentType: mimeType,
          ACL: 'private'
        })
      );
      return { storedName, relativePath, storageProvider: 'spaces' };
    },
    async read(relativePath) {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await getClient();
      const response = await client.send(new GetObjectCommand({ Bucket: env.spaces.bucket, Key: relativePath }));
      const chunks = [];
      for await (const chunk of response.Body) chunks.push(chunk);
      return Buffer.concat(chunks);
    },
    async remove(relativePath) {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await getClient();
      await client.send(new DeleteObjectCommand({ Bucket: env.spaces.bucket, Key: relativePath }));
    },
    async signedUrl(relativePath) {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      const client = await getClient();
      return getSignedUrl(client, new GetObjectCommand({ Bucket: env.spaces.bucket, Key: relativePath }), {
        expiresIn: env.spaces.signedUrlTtl
      });
    }
  };
}

// ---------------------------------------------------------------------------
// Supabase Storage provider — private bucket, signed URLs for downloads.
// Lazy-loads @supabase/supabase-js (already installed).
// ---------------------------------------------------------------------------
function createSupabaseProvider() {
  let clientInstance = null;

  async function getClient() {
    if (!clientInstance) {
      const { createClient } = await import('@supabase/supabase-js');
      clientInstance = createClient(env.supabase.url, env.supabase.serviceKey, {
        auth: { persistSession: false }
      });
    }
    return clientInstance;
  }

  return {
    name: 'supabase',
    async save({ buffer, employeeId, originalName, mimeType, timestamp }) {
      const supabase = await getClient();
      const storedName = `${timestamp}-${sanitizeName(originalName)}`;
      // Path inside the bucket — bucket name is already 'employee-documents',
      // so we don't repeat it here.
      const storagePath = `${employeeId}/${storedName}`;

      const { error } = await supabase.storage
        .from(env.supabase.bucket)
        .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

      if (error) throw new Error(`Supabase upload failed: ${error.message}`);
      return { storedName, relativePath: storagePath, storageProvider: 'supabase' };
    },

    async read(relativePath) {
      const supabase = await getClient();
      const { data, error } = await supabase.storage
        .from(env.supabase.bucket)
        .download(relativePath);

      if (error) throw new Error(`Supabase read failed: ${error.message}`);
      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    },

    async remove(relativePath) {
      const supabase = await getClient();
      const { error } = await supabase.storage
        .from(env.supabase.bucket)
        .remove([relativePath]);

      if (error) throw new Error(`Supabase delete failed: ${error.message}`);
    },

    async signedUrl(relativePath) {
      const supabase = await getClient();
      const { data, error } = await supabase.storage
        .from(env.supabase.bucket)
        .createSignedUrl(relativePath, env.supabase.signedUrlTtl);

      if (error) throw new Error(`Supabase signed URL failed: ${error.message}`);
      return data.signedUrl;
    }
  };
}

const providers = {
  local: localProvider,
  spaces: createSpacesProvider(),
  supabase: createSupabaseProvider()
};

export function getStorageProvider(name) {
  return providers[name] || providers[env.storageProvider] || localProvider;
}

export async function saveDocument({ buffer, employeeId, originalName, mimeType, timestamp }) {
  const provider = getStorageProvider(env.storageProvider);
  return provider.save({ buffer, employeeId, originalName, mimeType, timestamp });
}

export async function readDocument({ relativePath, storageProvider }) {
  const provider = getStorageProvider(storageProvider);
  return provider.read(relativePath);
}

export async function removeDocument({ relativePath, storageProvider }) {
  const provider = getStorageProvider(storageProvider);
  return provider.remove(relativePath);
}

// Returns a signed URL when the backend supports it (Spaces), else null so the
// caller serves the file through the authenticated download route instead.
export async function getDownloadUrl({ relativePath, storageProvider }) {
  const provider = getStorageProvider(storageProvider);
  return provider.signedUrl(relativePath);
}
