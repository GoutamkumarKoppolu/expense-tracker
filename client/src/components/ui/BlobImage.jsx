import { useEffect, useRef } from "react";

// <img> for an image stored as a Blob (e.g. an uploaded bill). The object URL
// is created when shown and released when the image goes away, so large
// photos don't stay in memory.
export default function BlobImage({ blob, alt, className, loading = "lazy" }) {
  const ref = useRef(null);

  useEffect(() => {
    const img = ref.current;
    if (!img || !blob) return undefined;
    const url = URL.createObjectURL(blob);
    img.src = url;
    return () => {
      img.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  return <img ref={ref} alt={alt} className={className} loading={loading} decoding="async" />;
}
