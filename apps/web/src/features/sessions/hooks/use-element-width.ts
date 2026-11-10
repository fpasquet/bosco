'use client';
import { type RefObject, useEffect, useRef, useState } from 'react';

/** Largeur rendue d'un élément, suivie au redimensionnement ; indéfinie avant la première mesure. */
export function useElementWidth<T extends Element>(): [RefObject<T | null>, number | undefined] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number>();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}
