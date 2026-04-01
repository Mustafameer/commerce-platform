import * as React from 'react';

export const buildRenderableImageSources = (...sources: Array<unknown>) => {
  const flattenedSources = sources.flatMap((source) => (Array.isArray(source) ? source : [source]));
  const normalizedSources = flattenedSources
    .map((source) => (typeof source === 'string' ? source.trim() : ''))
    .filter(Boolean);

  return Array.from(new Set(normalizedSources));
};

type RenderableImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  sources: Array<unknown>;
  fallback?: React.ReactNode;
};

export const RenderableImage = React.forwardRef<HTMLImageElement, RenderableImageProps>(function RenderableImage(
  { sources, fallback = null, onError, ...props },
  ref,
) {
  const normalizedSources = React.useMemo(() => buildRenderableImageSources(sources), [sources]);
  const [sourceIndex, setSourceIndex] = React.useState(0);

  React.useEffect(() => {
    setSourceIndex(0);
  }, [normalizedSources]);

  const currentSource = normalizedSources[sourceIndex] || '';

  if (!currentSource) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      {...props}
      ref={ref}
      src={currentSource}
      onError={(event) => {
        if (sourceIndex < normalizedSources.length - 1) {
          setSourceIndex((currentIndex) => currentIndex + 1);
          return;
        }

        onError?.(event);
      }}
    />
  );
});