import Link from 'next/link';

export default function FeedItem({ item }) {
  const isVideo = item.videoUrl && (item.videoUrl.endsWith('.mp4') || item.videoUrl.includes('/videos/') || item.videoUrl.includes('m3u8'));
  const firstImage = item.mediaUrls && item.mediaUrls[0] || '';

  return (
    <article className="relative mx-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/5 bg-[#0d0d15] shadow-2xl transition-all duration-300 hover:border-cyan-500/25">
      {/* Feed Author Meta */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {item.authorId ? (
            <Link href={`/channels/${item.authorId}`} className="flex items-center gap-3 group">
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt={item.authorName}
                  className="h-10 w-10 rounded-full object-cover border border-white/10 group-hover:border-cyan-400"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-950 font-bold text-cyan-400 border border-cyan-500/20 group-hover:border-cyan-400">
                  {(item.authorName || 'T')[0].toUpperCase()}
                </span>
              )}
              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-400">
                  {item.authorName || 'TukTuk User'}
                </h3>
                {item.province && (
                  <p className="text-xs text-zinc-400">📍 {item.province}</p>
                )}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 font-bold text-zinc-400">
                T
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">{item.authorName || 'TukTuk User'}</h3>
                {item.province && <p className="text-xs text-zinc-400">📍 {item.province}</p>}
              </div>
            </div>
          )}
        </div>

        {item.type === 'product' && (
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20">
            สินค้า OTOP
          </span>
        )}
      </div>

      {/* Post Media Section */}
      <div className="relative aspect-[4/5] w-full bg-black/40">
        {isVideo ? (
          <video
            src={item.videoUrl}
            className="h-full w-full object-cover"
            controls
            preload="metadata"
            muted
            playsInline
          />
        ) : firstImage ? (
          <img
            src={firstImage}
            alt={item.title || item.content}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-zinc-600">
            No Media
          </div>
        )}

        {/* Overlay Details for OTOP product */}
        {item.type === 'product' && (
          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-md shadow-2xl">
            <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
            <div className="mt-2 flex items-center justify-between">
              {item.price != null && (
                <span className="text-base font-bold text-cyan-400">
                  ฿{Number(item.price).toLocaleString('th-TH')}
                </span>
              )}
              <Link
                href={`/products/${item.id}`}
                className="rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-bold text-black hover:bg-cyan-300"
              >
                ดูรายละเอียด
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Post Text content (For Non-product or additional post desc) */}
      {item.type !== 'product' && (
        <div className="p-4">
          <p className="whitespace-pre-line text-sm text-zinc-300 line-clamp-3">
            {item.content}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 border-t border-white/5 pt-3">
            <div className="flex gap-4">
              <span>❤️ {item.likes || 0}</span>
              <span>💬 {item.commentsCount || 0}</span>
            </div>
            <Link href={`/posts/${item.id}`} className="text-cyan-400 hover:underline">
              ดูโพสต์ทั้งหมด
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
