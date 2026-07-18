import Link from 'next/link';

export default function ProductCard({ product }) {
  const imageUrl = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || '';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0d0d15] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-[0_8px_30px_rgb(6,182,212,0.1)]">
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-black/40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title || product.productName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-xs text-zinc-600">
            ไม่มีรูปภาพ
          </div>
        )}

        {/* Location Badge */}
        {product.province && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur-sm">
            📍 {product.province}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-white group-hover:text-cyan-400">
          {product.title || product.productName}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
          {product.description || product.detail}
        </p>
        
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-cyan-400">
            ฿{Number(product.price || 0).toLocaleString('th-TH')}
          </span>
          <Link
            href={`/products/${product.id || product.productId}`}
            className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 text-[10px] font-bold text-cyan-400 hover:bg-cyan-400 hover:text-black transition-colors"
          >
            ดูเพิ่มเติม
          </Link>
        </div>
      </div>
    </div>
  );
}
