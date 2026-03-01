import React from 'react';

export function ResponsiveImage({ src, alt, className, sizes = "100vw", priority = false }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!src) return null;

  const isPicsum = src.includes('picsum.photos');
  const isUpload = src.startsWith('/uploads/');

  let srcset = "";
  if (isPicsum) {
    const parts = src.split('/');
    const baseUrl = parts.slice(0, -2).join('/');
    srcset = `
      ${baseUrl}/400/300 400w,
      ${baseUrl}/800/600 800w,
      ${baseUrl}/1200/900 1200w
    `.trim();
  } else if (isUpload) {
    const ext = src.substring(src.lastIndexOf('.'));
    const base = src.substring(0, src.lastIndexOf('.'));
    srcset = `
      ${base}-sm${ext} 400w,
      ${base}-md${ext} 800w,
      ${base}-lg${ext} 1200w,
      ${src} 1600w
    `.trim();
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      srcSet={srcset || undefined}
      sizes={srcset ? sizes : undefined}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
