import {useEffect, useRef, useState} from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {},
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const {threshold = 0.1, root = null, rootMargin = '0px'} = options;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isCurrentlyIntersecting = entry.isIntersecting;
        setIsIntersecting(isCurrentlyIntersecting);

        if (isCurrentlyIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {threshold, root, rootMargin},
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [
    options.threshold,
    options.root,
    options.rootMargin,
    options.triggerOnce,
    hasIntersected,
  ]);

  return {
    ref,
    isIntersecting: options.triggerOnce ? hasIntersected : isIntersecting,
    hasIntersected,
  };
}
