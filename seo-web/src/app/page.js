import { api } from '@/lib/api';
import Header from '@/components/Header';
import FeedItem from '@/components/FeedItem';

export const runtime = 'edge';
export const revalidate = 60; // Revalidate home page every 60 seconds

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const province = params?.province || '';
  const feedItems = await api.getFeed(province);

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
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
              ดูคลิปเพลิน เลือกช้อปของดีทั่วไทย
            </h1>
            <p className="mt-4 mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">
              พบกับคลิปสั้นสุดสร้างสรรค์จากคนในชุมชน และสินค้า OTOP ยอดฮิตส่งตรงจากแหล่งผลิตถึงมือคุณ
            </p>

            {/* Province Picker Links */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {featuredProvinces.map((prov) => {
                const isActive = (province === prov.code);
                const query = prov.code ? `?province=${encodeURIComponent(prov.code)}` : '/';
                return (
                  <a
                    key={prov.name}
                    href={query}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all border ${
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

          {/* Feed Layout */}
          {feedItems.length > 0 ? (
            <div className="mx-auto max-w-lg space-y-8">
              {feedItems.map((item) => (
                <FeedItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-white/5 rounded-3xl bg-[#0d0d15]/50 backdrop-blur-sm max-w-lg mx-auto">
              <span className="text-4xl">📺</span>
              <h3 className="mt-4 text-base font-semibold text-white">ไม่มีโพสต์หรือสินค้าจัดแสดงในขณะนี้</h3>
              <p className="mt-2 text-sm text-zinc-500">กรุณาเลือกจังหวัดอื่น หรือกลับมาตรวจสอบใหม่อีกครั้ง</p>
            </div>
          )}
        </div>
      </main>

      {/* Public Footer */}
      <footer className="mt-20 border-t border-white/5 py-8 text-center text-xs text-zinc-600 bg-black/30">
        <p>© {new Date().getFullYear()} TukTuk Thailand. All rights reserved.</p>
        <p className="mt-2">แพลตฟอร์มสนับสนุน OTOP และเครือข่ายท่องเที่ยวชุมชนไทย</p>
      </footer>
    </div>
  );
}
