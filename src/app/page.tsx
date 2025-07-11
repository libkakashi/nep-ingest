'use client';

import {useState} from 'react';
import {Card, CardContent} from '~/components/ui/card';
import {ProductCard} from '~/components/product-card';
import {ImageUploadSection} from '~/components/image-upload-section';
import {Button} from '~/components/ui/button';

import {api} from '~/trpc/react';

import type {Product} from '~/lib/products';
import {compressImage, fileToBinary} from '~/lib/image-compression';

export type UIProduct = Omit<Product, 'images'> & {
  hasLongSleeves: boolean;
  size: string;
  images: File[];
};

export default function Home() {
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [isCreatingProducts, setIsCreatingProducts] = useState(false);
  const [createdProductsCount, setCreatedProductsCount] = useState(0);

  const processImagesMutation = api.products.processImages.useMutation({
    onSuccess: data => {
      const productsWithFiles: UIProduct[] = data.map(product => ({
        title: product.title,
        description: product.description,
        hasLongSleeves: product.hasLongSleeves,
        size: `Shoulder - \nBust - \nLength - \n${product.hasLongSleeves ? 'Sleeves - ' : ''}`,
        images: product.imageIndexes.map(index => originalFiles[index]),
        category: product.category,
        price: product.price,
      }));
      setProducts(productsWithFiles);
    },
  });

  const createShopifyProductMutation =
    api.products.createShopifyProduct.useMutation({
      onSuccess: () => {
        setCreatedProductsCount(prev => prev + 1);
      },
      onError: error => {
        setIsCreatingProducts(false);
        alert(`Error creating product: ${error.message}`);
      },
    });

  const handleImagesProcess = async (files: File[]) => {
    const compressed = [];
    for (const file of files) compressed.push(await compressImage(file));

    setOriginalFiles(files);

    const binary = await Promise.all(compressed.map(fileToBinary));
    await processImagesMutation.mutateAsync({images: binary});
  };

  const handleCreateShopifyProducts = async () => {
    if (products.length === 0) return;
    setIsCreatingProducts(true);
    setCreatedProductsCount(0);

    try {
      for (const product of products) {
        const prod: Product = {
          title: product.title,
          description:
            '**' + product.size.trim() + '**' + '\n\n' + product.description,
          price: product.price,
          category: product.category,
          images: await Promise.all(product.images.map(fileToBinary)),
        };
        await createShopifyProductMutation.mutateAsync({product: prod});
        setCreatedProductsCount(prev => prev + 1);
      }
      setIsCreatingProducts(false);
      alert('All products created successfully in Shopify!');
      window.location.reload();
    } catch (error) {
      setIsCreatingProducts(false);
      alert(`Error creating products: ${error}`);
    }
  };

  const handleProductUpdate = (index: number, updatedProduct: UIProduct) => {
    setProducts(prev =>
      prev.map((product, i) => (i === index ? updatedProduct : product)),
    );
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-gray-50">
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {products.length === 0 && (
          <div className="mx-auto max-w-4xl">
            <ImageUploadSection
              onImagesProcess={handleImagesProcess}
              isProcessing={processImagesMutation.isPending}
              disabled={processImagesMutation.isPending}
            />

            {processImagesMutation.isError && (
              <Card className="mt-6 border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-red-600">
                    Error processing images:{' '}
                    {processImagesMutation.error?.message}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {products.length > 0 && (
          <div className="pb-24">
            <div className="grid grid-cols-1 gap-6">
              {products.map((product, index) => (
                <ProductCard
                  key={index}
                  product={product}
                  onUpdate={updatedProduct =>
                    handleProductUpdate(index, updatedProduct)
                  }
                />
              ))}
            </div>

            <div className="pb-safe fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white p-4">
              <div className="mx-auto max-w-4xl">
                <Button
                  onClick={handleCreateShopifyProducts}
                  disabled={
                    isCreatingProducts || createShopifyProductMutation.isPending
                  }
                  className="w-full rounded-lg bg-green-600 px-8 py-3 font-semibold text-white hover:bg-green-700"
                >
                  {isCreatingProducts || createShopifyProductMutation.isPending
                    ? `Creating Products... (${createdProductsCount}/${products.length})`
                    : 'Create Products in Shopify'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
