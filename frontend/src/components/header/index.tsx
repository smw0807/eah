import logoText from "@/assets/EAH.png";
import { Link } from "react-router";
export default function Header() {
  return (
    <header className="border-border bg-background sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 */}
          <Link
            to="/"
            className="text-primary flex items-center gap-2 text-xl font-bold transition-opacity hover:opacity-80"
          >
            <span>EAH</span>
          </Link>

          {/* 중앙 제목 */}
          <h1 className="text-foreground flex items-center gap-2 text-xl font-semibold">
            <img src={logoText} alt="logo" className="size-30" />
          </h1>

          {/* 마이페이지 */}
          <Link
            to="/mypage"
            className="text-foreground hover:bg-muted-foreground rounded-md px-3 py-1 font-medium transition-colors"
          >
            마이페이지
          </Link>
        </div>
      </div>
    </header>
  );
}
