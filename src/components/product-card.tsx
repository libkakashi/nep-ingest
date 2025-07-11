'use client';
import Image from 'next/image';
import {useEffect, useMemo} from 'react';

import {Card, CardContent} from '~/components/ui/card';
import {Input} from '~/components/ui/input';
import {Textarea} from '~/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import type {UIProduct} from '~/app/page';
import {useIntersectionObserver} from '~/hooks/useIntersectionObserver';

interface ProductCardProps {
  product: UIProduct;
  onUpdate: (product: UIProduct) => void;
}

export function ProductCard({product, onUpdate}: ProductCardProps) {
  const {ref, isIntersecting} = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  });

  const imageUrls = useMemo(() => {
    return isIntersecting
      ? product.images.map(img => URL.createObjectURL(img))
      : [];
  }, [isIntersecting, product.images]);

  useEffect(() => {
    return () => {
      for (const url of imageUrls) {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, [imageUrls]);

  return (
    <Card className="group border-gray-200 bg-white transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Images */}
          <div className="flex-1 p-4">
            <div ref={ref} className="grid grid-cols-4 gap-2 md:grid-cols-2">
              {isIntersecting
                ? imageUrls.map((imageUrl, imgIndex) => (
                    <div
                      key={imgIndex}
                      className="relative overflow-hidden rounded-lg"
                    >
                      <Image
                        src={imageUrl}
                        alt={`${product.title} ${imgIndex + 1}`}
                        className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        width={200}
                        height={128}
                      />
                    </div>
                  ))
                : // Show placeholder for each image slot
                  product.images.map((_, imgIndex) => (
                    <div
                      key={imgIndex}
                      className="relative flex h-32 animate-pulse items-center justify-center overflow-hidden rounded-lg bg-gray-200"
                    >
                      <span className="text-xs text-gray-400">Loading...</span>
                    </div>
                  ))}
            </div>
          </div>

          {/* Right side - Form fields */}
          <div className="flex-1 space-y-4 p-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Title
              </label>
              <Input
                defaultValue={product.title}
                className="w-full"
                onChange={e => onUpdate({...product, title: e.target.value})}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price
              </label>
              <Input
                type="number"
                defaultValue={product.price}
                className="w-full"
                placeholder="0.00"
                onChange={e =>
                  onUpdate({...product, price: parseFloat(e.target.value) || 0})
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Size
              </label>
              <Textarea
                defaultValue={product.size}
                className="min-h-[100px] w-full"
                rows={4}
                onChange={e => onUpdate({...product, size: e.target.value})}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <Textarea
                defaultValue={product.description}
                className="min-h-[100px] w-full"
                rows={10}
                onChange={e =>
                  onUpdate({...product, description: e.target.value})
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Category
              </label>
              <Select
                defaultValue={product.category}
                onValueChange={value => onUpdate({...product, category: value})}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {['midi', 'mini', 'top'].map(category => (
                    <SelectItem
                      value={category}
                      key={category}
                      className="capitalize"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
