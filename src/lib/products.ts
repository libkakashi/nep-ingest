import {z} from 'zod';
import {minor} from '../server/models';
import {BinaryFile, ZBinaryFile} from './image-compression';

export const categories = ['midi', 'mini', 'top'] as const;

const ZProductOutput = z.object({
  title: z.string(),
  description: z.string(),
  imageIndexes: z.array(z.number()),
  category: z.enum(categories),
  price: z.number().min(0).default(500),
  hasLongSleeves: z.boolean().default(false),
});
type ProductOutput = z.infer<typeof ZProductOutput>;

export const ZProduct = z.object({
  title: z.string(),
  description: z.string(),
  images: z.array(ZBinaryFile),
  category: z.enum(categories),
  price: z.number().min(0).default(500),
});
export type Product = z.infer<typeof ZProduct>;

const processImages = async (images: string[]) => {
  const imageMessages = images
    .map((base64Image, index) => [
      {type: 'text' as const, text: `Image ${index}:`},
      {type: 'image' as const, image: base64Image},
    ])
    .flat();

  const prompt = `
You are a fashion expert tasked with analyzing clothing images and organizing them into structured shopify product listings.

I will provide you with ${images.length} clothing images. Your task is to:

1. Analyze all the images and identify distinct products/clothing items
2. Group similar items together (same design, different colors/sizes, etc.)
3. Generate appropriate product titles and descriptions
4. Assign relevant categories
5. Map which image indexes belong to each product

For each product, provide:
- title: A clear, descriptive product name (e.g., "Floral Summer Dress", "Classic Denim Jacket")
- description: A detailed description including style, material hints, occasion, and key features
- imageIndexes: Array of image indexes that show this product, indexes start from 0
- category: One of these categories: 'midi' | 'mini' | 'top' | 'dresses'
- hasLongSleeves: boolean, whether the product has long sleeves or not

Guidelines:
- If images show the same item from different angles or in different colors, group them as one product
- Be specific and appealing in titles and descriptions
- Focus on style, fit, occasion, and visual appeal
- Use fashion terminology appropriately
- Ensure all image indexes are used across all products
- The title and descriptions are for non-native english speakers, keep them simple
- The sequence of images for a product should be full length front picture, slightly zoomed front picture, then back picture.
  Make sure you pick the indexes to match this sequence for every product

- Example Title: \`Impressionist Floral Wrap Dress - Short Sleeve V-Neck Midi Dress with Tie Belt\`
- Example description:
\`\`\`
A folk-inspired midi dress featuring warm autumn stripes in orange, brown, and beige with traditional dirndl details including ruffled collar, button-front bodice, and lace-up.

**Key Features:**
- Multi-colored vertical stripes in autumn tones
- Ruffled collar detail
- Button-front closure on bodice
- Lace-up corset-style
- Sleeveless design
- A-line midi skirt
- Traditional folk-inspired construction

**Style:**
- Folk traditional
- Dirndl-inspired
- Vintage European
- Autumn harvest aesthetic

**Occasion:**
- Oktoberfest celebrations
- Fall festivals
- Cultural events
- Harvest gatherings
- Renaissance fairs3
- Themed parties
- Autumn weddings
\`\`\`

Output Format:
{
  products: Array<{
    title: string;
    description: string;
    imageIndexes: number[];
    category: 'midi' | 'mini' | 'top';
    hasLongSleeves: boolean;
  }>
}
Output as raw parsable JSON with no additional text or formatting.
`;

  const messages = [
    {
      role: 'user' as const,
      content: [{type: 'text' as const, text: prompt}, ...imageMessages],
    },
  ];

  return messages;
};

const validateProducts = (products: ProductOutput[], images: string[]) => {
  const usedIndexes = new Set();

  for (const product of products) {
    for (const index of product.imageIndexes) {
      if (index < 0 || index >= images.length) {
        throw new Error(`Invalid image index: ${index}`);
      }
      usedIndexes.add(index);
    }
  }
  if (usedIndexes.size !== images.length) {
    console.warn(
      `Warning: Only ${usedIndexes.size} out of ${images.length} images were used in products`,
    );
  }
  return products;
};

export const processClothingImages = async (images: BinaryFile[]) => {
  const base64Images = images.map(imageData => {
    const mimeType = imageData.type || 'image/jpeg';
    const binaryString = Array.from(imageData.data)
      .map(byte => String.fromCharCode(byte))
      .join('');
    const base64Data = btoa(binaryString);
    return `data:${mimeType};base64,${base64Data}`;
  });

  const messages = await processImages(base64Images);

  const {products} = await minor.genJson(
    messages,
    z.object({products: z.array(ZProductOutput)}),
  );
  return validateProducts(products, base64Images);
};
