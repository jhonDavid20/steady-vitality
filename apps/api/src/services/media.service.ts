import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env';

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

export class MediaService {
  async createUpload(userId: string, contentType: string, size: number) {
    const storage = config.objectStorage;
    if (!storage.endpoint || !storage.bucket || !storage.accessKeyId || !storage.secretAccessKey || !storage.publicBaseUrl) {
      throw new Error('Object storage is not configured');
    }
    const extension = extensions[contentType];
    if (!extension || size <= 0 || size > 50 * 1024 * 1024) throw new Error('Unsupported media upload');
    const key = `coaching/${userId}/${randomUUID()}.${extension}`;
    const client = new S3Client({
      endpoint: storage.endpoint,
      region: storage.region,
      forcePathStyle: true,
      credentials: { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey },
    });
    const uploadUrl = await getSignedUrl(client, new PutObjectCommand({ Bucket: storage.bucket, Key: key, ContentType: contentType, ContentLength: size }), { expiresIn: 300 });
    return { uploadUrl, publicUrl: `${storage.publicBaseUrl.replace(/\/$/, '')}/${key}`, expiresIn: 300, headers: { 'Content-Type': contentType } };
  }
}
