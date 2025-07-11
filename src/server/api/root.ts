import {productsRouter} from '~/server/api/routers/products';
import {createCallerFactory, createTRPCRouter} from '~/server/api/trpc';

export const appRouter = createTRPCRouter({
  products: productsRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
