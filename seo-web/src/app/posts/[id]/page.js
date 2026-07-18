import { api } from '@/lib/api';
import Header from '@/components/Header';
import FeedItem from '@/components/FeedItem';
import Link from 'next/link';

export const runtime = 'edge';

// Dynamic SEO metadata generation
export async function generateMetadata({ params }) {
  const { id } = await params;
  const post = await api.getPost(id);

  if (!post) {
    return {
      title: 'ไม่พบโพสต์ | TukTuk Thailand',
      description: 'โพสต์ที่คุณกำลังมองหาอาจถูกลบหรือไม่มีอยู่ในระบบ'
    };
  }

  const title = `โพสต์โดย ${post.authorName || 'TukTuk User'}`;
  const desc = post.content || 'ดูคลิปสั้นและโพสต์ OTOP สุดประทับใจบนแพลตฟอร์ม TukTuk Thailand';
  
  // Find a video thumbnail or image preview
  const videoUrl = post.videoUrl || '';
  const firstImage = post.mediaUrls && post.mediaUrls[0] || '';
  const imgUrl = firstImage || 'https://tuktukfeed.com/logo.png';

  return {
    title: `${title} | TukTuk Feed`,
    description: desc,
    openGraph: {
      title: `${title} | TukTuk Feed`,
      description: desc,
      type: 'video.other',
      url: `https://tuktukfeed.com/posts/${id}`,
      images: [
        {
          url: imgUrl,
          width: 800,
          height: 1000
        }
      ]
    }
  };
}

export default async function PostDetailPage({ params }) {
  const { id } = await params;
  const post = await api.getPost(id);

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col bg-[#06060a]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <span className="text-5xl">🔍</span>
          <h2 className="mt-4 text-xl font-bold text-white">ไม่พบโพสต์นี้</h2>
          <p className="mt-2 text-zinc-500">โพสต์ที่คุณมองหาอาจถูกนำออกหรือลิ้งก์ไม่ถูกต้อง</p>
          <Link href="/" className="mt-6 rounded-full bg-cyan-400 px-6 py-2 text-sm font-semibold text-black hover:bg-cyan-300">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  // Map post DB data to FeedItem model
  const feedItem = {
    id: post.id,
    type: 'post',
    authorName: post.authorName,
    authorId: post.userId,
    avatarUrl: post.avatarUrl,
    content: post.content,
    videoUrl: post.videoUrl,
    mediaUrls: post.mediaUrls,
    province: post.province,
    createdAt: post.createdAt,
    likes: post.likes,
    commentsCount: post.commentsCount,
    viewCount: post.viewCount
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#06060a]">
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg space-y-6">
          <FeedItem item={feedItem} />

          <div className="flex flex-col gap-3 pt-4 text-center">
            <a
              href={`https://tuktukfeed.com/app/?postId=${id}`}
              className="flex h-12 w-full items-center justify-center rounded-full bg-cyan-400 text-sm font-bold text-black hover:bg-cyan-300 transition-transform active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              🚀 เปิดดูวิดีโอนี้บนแอปมือถือ
            </a>
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              ดูฟีดทั้งหมด
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
