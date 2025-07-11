import {z} from 'zod';

import {createTRPCRouter, publicProcedure} from '~/server/api/trpc';
import {processClothingImages, ZProduct} from '~/lib/products';
import {createProduct} from '~/lib/shopify';
import {ZBinaryFile} from '~/lib/image-compression';

export const productsRouter = createTRPCRouter({
  processImages: publicProcedure
    .input(z.object({images: z.array(ZBinaryFile)}))
    .mutation(async ({input}) => {
      const products = await processClothingImages(input.images);
      return products;
    }),

  createShopifyProduct: publicProcedure
    .input(z.object({product: ZProduct}))
    .mutation(({input}) => createProduct(input.product)),
});
