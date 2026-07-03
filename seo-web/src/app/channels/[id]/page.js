import { api } from '@/lib/api';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import FeedItem from '@/components/FeedItem';
import Link from 'next/link';

export const runtime = 'edge';

// Dynamic SEO metadata generation
export async function generateMetadata({ params }) {
  const { id } = await params;
  const user = await api.getUser(id);

  if (!user) {
    return {
      title: 'ไม่พบผู้ใช้ | TukTuk Thailand',
      description: 'บัญชีผู้ใช้นี้อาจไม่มีอยู่หรือถูกปิดการใช้งาน'
    };
  }

  const title = `${user.displayName} | ร้านค้าสมาชิก TukTuk OTOP`;
  const desc = `ช่องร้านค้าอย่างเป็นทางการของ ${user.displayName} บน TukTuk Thailand แหล่งรวมของดี OTOP ของแท้จากท้องถิ่น`;
  const imgUrl = user.pictureUrl || 'https://tuktukfeed.com/logo.png';

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: 'profile',
      url: `https://tuktukfeed.com/channels/${id}`,
      images: [
        {
          url: imgUrl,
          width: 400,
          height: 400
        }
      ]
    }
  };
}

export default async function ChannelDetailPage({ params }) {
  const { id } = await params;
  
  // Fetch user profile
  const user = await api.getUser(id);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-[#06060a]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <span className="text-5xl">🔍</span>
          <h2 className="mt-4 text-xl font-bold text-white">ไม่พบช่องนี้</h2>
          <p className="mt-2 text-zinc-500">ช่องสมาชิกที่คุณต้องการดูอาจไม่มีอยู่ในระบบ</p>
          <Link href="/" className="mt-6 rounded-full bg-cyan-400 px-6 py-2 text-sm font-semibold text-black hover:bg-cyan-300">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  // Fetch user's posts & products
  const posts = await api.getUserPosts(id);
  const allProducts = await api.getProducts();
  const products = allProducts.filter(p => p.sellerId === id || p.lineUserId === id);

  return (
    <div className="flex min-h-screen flex-col bg-[#06060a]">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* User Profile Banner Header */}
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0d0d15] p-6 sm:p-8 mb-12 shadow-2xl">
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
              {user.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt={user.displayName}
                  className="h-24 w-24 rounded-full object-cover border-2 border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                />
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-950 text-3xl font-extrabold text-cyan-400 border border-cyan-500/20">
                  {user.displayName[0].toUpperCase()}
                </span>
              )}

              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-black text-white">{user.displayName}</h1>
                  {user.isPremium && (
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                      👑 PREMIUM
                    </span>
                  )}
                  {user.sellerStatus === 'approved' && (
                    <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400">
                      ✓ ผู้ขายที่ได้รับการรับรอง
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  สมาชิกชุมชนผู้ผลิตสินค้าท้องถิ่น TukTuk Thailand
                </p>
              </div>
            </div>
            
            {/* Background Glow Design */}
            <div className="absolute top-0 right-0 h-64 w-64 bg-cyan-500/5 rounded-full filter blur-[80px]" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Middle Columns: Creator Products Grid */}
            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-xl font-bold text-white border-l-4 border-cyan-400 pl-3">
                สินค้า OTOP ทั้งหมด ({products.length})
              </h2>

              {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id || product.productId} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-white/5 rounded-2xl bg-[#0d0d15]/30">
                  <p className="text-sm text-zinc-500">ยังไม่มีสินค้าวางจำหน่ายในขณะนี้</p>
                </div>
              )}
            </div>

            {/* Right Column: Creator Community Posts list */}
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-white border-l-4 border-cyan-400 pl-3">
                ฟีดความเคลื่อนไหว ({posts.length})
              </h2>

              {posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <FeedItem key={post.id} item={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border border-white/5 rounded-2xl bg-[#0d0d15]/30">
                  <p className="text-sm text-zinc-500">ไม่มีโพสต์หรือเนื้อหาวิดีโอสั้นเพิ่มเติม</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
