import ImageKit from 'imagekit';
import sharp from 'sharp';
import fs from 'fs';

export function getImageKitInstance(): ImageKit | null {
  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;
  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    return null;
  }
  return new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });
}

export async function processImageToWebp(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer).webp({ lossless: true, effort: 4 }).toBuffer();
}

export async function uploadImageToImageKit(buffer: Buffer, fileName: string): Promise<string | null> {
  const imageKit = getImageKitInstance();
  if (!imageKit) {
    console.warn('ImageKit not configured; skipping image upload');
    return null;
  }

  try {
    const uploadResult = await imageKit.upload({
      file: buffer,
      fileName,
      useUniqueFileName: true,
    });
    return uploadResult?.url || null;
  } catch (error) {
    console.error('ImageKit upload error:', error);
    return null;
  }
}

export async function processAndUploadImage(fileBuffer: Buffer, fileName: string): Promise<string | null> {
  const processed = await processImageToWebp(fileBuffer);
  return await uploadImageToImageKit(processed, fileName);
}

export async function processAndUploadMultipleImages(files: any[], baseFileName: string): Promise<string[]> {
  const uploadPromises = files.map(async (file, index) => {
    const processed = await processImageToWebp(file.buffer);
    const fileName = `${baseFileName}_${Date.now()}_${index}.webp`;
    return await uploadImageToImageKit(processed, fileName);
  });

  const results = await Promise.all(uploadPromises);
  return results.filter((url): url is string => url !== null);
}

export function isValidBuffer(buffer: Buffer): boolean {
  return Buffer.isBuffer(buffer) && buffer.length > 100;
}

export async function fileToBuffer(file: any): Promise<Buffer> {
  if (file?.buffer) {
    return file.buffer;
  } else if (file?.path) {
    return await fs.promises.readFile(file.path);
  } else {
    throw new TypeError('Invalid file input: missing buffer or path');
  }
}

export async function cleanupFiles(files: any[] = []): Promise<void> {
  if (!Array.isArray(files)) return;
  
  await Promise.all(
    files.map(async (file) => {
      if (file?.path) {
        try {
          await fs.promises.unlink(file.path);
        } catch (err: any) {
          console.error(`Failed to delete temp file ${file.path}:`, err.message);
        }
      }
    })
  );
}
