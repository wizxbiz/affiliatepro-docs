import { api } from '@/lib/api';
import Header from '@/components/Header';
import Link from 'next/link';

export const runtime = 'edge';

// Dynamic SEO metadata generation
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await api.getProduct(id);

  if (!product) {
    return {
      title: 'ไม่พบสินค้า | TukTuk Thailand',
      description: 'สินค้าที่คุณกำลังมองหาอาจถูกลบหรือไม่มีอยู่ในระบบ'
    };
  }

  const title = `${product.title || product.productName} - ฿${Number(product.price || 0).toLocaleString('th-TH')}`;
  const desc = product.description || product.detail || 'ช้อปสินค้า OTOP ยอดฮิตส่งตรงจากชุมชนกับ TukTuk Thailand';
  const imgUrl = product.imageUrl || (Array.isArray(product.images) && product.images[0]) || 'https://tuktukfeed.com/logo.png';

  return {
    title: `${title} | TukTuk OTOP`,
    description: desc,
    openGraph: {
      title: `${title} | TukTuk OTOP`,
      description: desc,
      type: 'website',
      url: `https://tuktukfeed.com/products/${id}`,
      images: [
        {
          url: imgUrl,
          width: 800,
          height: 800,
          alt: product.title || product.productName
        }
      ]
    }
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = await api.getProduct(id);

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-[#06060a]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <span className="text-5xl">🔍</span>
          <h2 className="mt-4 text-xl font-bold text-white">ไม่พบสินค้านี้</h2>
          <p className="mt-2 text-zinc-500">สินค้าที่คุณมองหาอาจถูกนำออกหรือลิ้งก์ไม่ถูกต้อง</p>
          <Link href="/" className="mt-6 rounded-full bg-cyan-400 px-6 py-2 text-sm font-semibold text-black hover:bg-cyan-300">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [product.imageUrl].filter(Boolean);
  const isVideo = product.videoUrl && (product.videoUrl.endsWith('.mp4') || product.videoUrl.includes('/videos/'));

  return (
    <div className="flex min-h-screen flex-col bg-[#06060a]">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/5 bg-[#0d0d15] overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Column: Media display */}
            <div className="relative aspect-square w-full bg-black/60 md:aspect-auto md:h-full min-h-[400px]">
              {isVideo ? (
                <video
                  src={product.videoUrl}
                  className="h-full w-full object-cover"
                  controls
                  preload="metadata"
                  playsInline
                />
              ) : images[0] ? (
                <img
                  src={images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-600">
                  ไม่มีรูปภาพ
                </div>
              )}
            </div>

            {/* Right Column: Details info */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    {product.category || 'OTOP สินค้าทั่วไป'}
                  </span>
                  {product.province && (
                    <span className="text-xs text-zinc-400">
                      📍 {product.province}
                    </span>
                  )}
                </div>

                <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
                  {product.title || product.productName}
                </h1>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-cyan-400">
                    ฿{Number(product.price || 0).toLocaleString('th-TH')}
                  </span>
                </div>

                {/* Seller Meta Block */}
                {product.sellerId && (
                  <div className="mt-6 border-t border-b border-white/5 py-4">
                    <Link href={`/channels/${product.sellerId}`} className="flex items-center gap-3 group">
                      {product.sellerAvatar ? (
                        <img
                          src={product.sellerAvatar}
                          alt={product.sellerName}
                          className="h-10 w-10 rounded-full object-cover border border-white/10 group-hover:border-cyan-400"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-950 font-bold text-cyan-400 group-hover:border-cyan-400">
                          {(product.sellerName || 'T')[0].toUpperCase()}
                        </span>
                      )}
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-cyan-400">
                          {product.sellerName || 'TukTuk Seller'}
                        </h4>
                        <p className="text-xs text-zinc-500">ดูหน้าร้านค้าของสมาชิกนี้</p>
                      </div>
                    </Link>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-bold text-white">รายละเอียดสินค้า</h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-zinc-400 leading-relaxed">
                    {product.description || product.detail || 'ไม่มีข้อมูลรายละเอียดเพิ่มเติมสำหรับสินค้านี้'}
                  </p>
                </div>
              </div>

              {/* Call To Action Buttons */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://tuktukfeed.com/app/market?productId=${id}`}
                  className="flex-1 flex h-12 items-center justify-center rounded-full bg-cyan-400 text-sm font-bold text-black hover:bg-cyan-300 transition-transform active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  📥 สั่งซื้อ / เปิดดูบนแอปมือถือ
                </a>
                <Link
                  href="/"
                  className="flex h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold text-zinc-400 hover:text-white hover:border-white/20"
                >
                  ดูสินค้าอื่นๆ
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
