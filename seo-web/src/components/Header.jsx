import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              TT
            </span>
            <span className="hidden bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:block">
              TukTuk Thailand
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
            ดูเพลิน
          </Link>
          <Link href="/products" className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
            ตลาดสินค้า
          </Link>
          <a
            href="https://tuktukfeed.com/app/"
            className="inline-flex h-9 items-center justify-center rounded-full bg-cyan-400 px-4 text-xs font-semibold text-black transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
          >
            เปิดแอป TukTuk
          </a>
        </nav>
      </div>
    </header>
  );
}
