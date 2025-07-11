import z from 'zod';

const maxWidth: number = 768;
const quality: number = 0.8;

export const compressImage = async (file: File): Promise<File> => {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas context not available');

  try {
    const compressed = await new Promise<File>((resolve, reject) => {
      img.onload = () => {
        const {width, height} = img;
        const aspectRatio = width / height;

        let newWidth = width;
        let newHeight = height;

        if (width > maxWidth) {
          newWidth = maxWidth;
          newHeight = maxWidth / aspectRatio;
        }
        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            const compressed = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          'image/jpeg',
          quality,
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
    return compressed;
  } finally {
    URL.revokeObjectURL(img.src);
  }
};

export const ZBinaryFile = z.object({
  name: z.string(),
  type: z.string(),
  data: z.instanceof(Uint8Array),
});
export type BinaryFile = z.infer<typeof ZBinaryFile>;

export const fileToBinary = async (file: File): Promise<BinaryFile> => {
  const uint8Array = new Uint8Array(await file.arrayBuffer());
  return {name: file.name, type: file.type, data: uint8Array};
};

export const binaryToBase64 = (binaryFile: BinaryFile) => {
  const buffer = Buffer.from(binaryFile.data);
  const base64 = buffer.toString('base64');
  return `data:${binaryFile.type};base64,${base64}`;
};

export const binaryToFile = (binaryFile: BinaryFile): File => {
  return new File([binaryFile.data], binaryFile.name, {
    type: binaryFile.type,
    lastModified: Date.now(),
  });
};
