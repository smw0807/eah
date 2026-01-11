import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function SideMenu() {
  const categories = [
    { name: "전체", href: "#" },
    { name: "전자기기", href: "#" },
    { name: "의류", href: "#" },
    { name: "도서", href: "#" },
    { name: "기타", href: "#" },
  ];
  return (
    <div>
      {/* 좌측 메뉴 */}
      <aside className="border-border w-64 shrink-0 border-r pr-6">
        <nav className="space-y-6">
          {/* 카테고리 섹션 */}
          <div>
            <h2 className="text-foreground mb-3 text-lg font-semibold">
              카테고리
            </h2>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.name}>
                  <a
                    href={category.href}
                    className="text-foreground hover:bg-muted block rounded-md px-3 py-2 text-sm transition-colors"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* 필터 섹션 */}
          <div>
            <h2 className="text-foreground mb-3 text-lg font-semibold">필터</h2>
            <div className="space-y-4">
              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  가격 범위
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="최소"
                    className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="최대"
                    className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-foreground mb-2 block text-sm font-medium">
                  정렬
                </label>
                <Select>
                  <SelectTrigger className="border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm">
                    <SelectValue placeholder="정렬" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="최신순">최신순</SelectItem>
                    <SelectItem value="가격 낮은순">가격 낮은순</SelectItem>
                    <SelectItem value="가격 높은순">가격 높은순</SelectItem>
                    <SelectItem value="마감 임박순">마감 임박순</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </div>
  );
}
