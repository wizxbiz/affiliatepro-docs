import { api } from '@/lib/api';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';

export const runtime = 'edge';
export const revalidate = 30; // Revalidate products index page every 30 seconds

export default async function ProductsPage({ searchParams }) {
  const params = await searchParams;
  const province = params?.province || '';
  const products = await api.getProducts(province);

  const featuredProvinces = [
    { name: 'ทั้งหมด', code: '' },
    { name: 'กรุงเทพฯ', code: 'กรุงเทพมหานคร' },
    { name: 'เชียงใหม่', code: 'เชียงใหม่' },
    { name: 'ภูเก็ต', code: 'ภูเก็ต' },
    { name: 'ขอนแก่น', code: 'ขอนแก่น' },
    { name: 'ชลบุรี', code: 'ชลบุรี' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#06060a]">
      <Header />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* Header section */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent sm:text-4xl">
              ตลาดสินค้าชุมชน OTOP
            </h1>
            <p className="mt-3 text-zinc-400 max-w-md mx-auto text-sm sm:text-base">
              เลือกซื้อของดี ของเด่นประจำจังหวัดจากผู้ผลิตท้องถิ่นโดยตรง ปลอดภัย ได้มาตรฐาน OTOP
            </p>

            {/* Province selector */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {featuredProvinces.map((prov) => {
                const isActive = (province === prov.code);
                const query = prov.code ? `?province=${encodeURIComponent(prov.code)}` : '/products';
                return (
                  <a
                    key={prov.name}
                    href={query}
                    className={`rounded-full px-4 py-1 text-xs font-semibold transition-all border ${
                      isActive
                        ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                        : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {prov.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Grid display */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id || product.productId} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-white/5 rounded-3xl bg-[#0d0d15]/50 backdrop-blur-sm max-w-lg mx-auto">
              <span className="text-4xl">🛍️</span>
              <h3 className="mt-4 text-base font-semibold text-white">ไม่มีสินค้าในสาขานี้</h3>
              <p className="mt-2 text-sm text-zinc-500">เลือกจังหวัดอื่นเพื่อค้นหาของดีประจำจังหวัดถัดไป</p>
            </div>
          )}

        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-8 text-center text-xs text-zinc-600 bg-black/30">
        <p>© {new Date().getFullYear()} TukTuk Thailand. All rights reserved.</p>
      </footer>
    </div>
  );
}
