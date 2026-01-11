import SideMenu from "@/components/side-menu";

export default function Home() {
  return (
    <div className="flex gap-6">
      <SideMenu />

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1">
        <h1 className="text-foreground mb-6 text-2xl font-bold">경매 상품</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 경매 아이템들이 여기에 표시됩니다 */}
          <div className="border-border rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              경매 상품이 여기에 표시됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
