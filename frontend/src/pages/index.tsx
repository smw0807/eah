import AddAuctionButton from "@/components/side-menu/AddAuctionButton";
import CategorySection from "@/components/side-menu/CategorySection";
import FilterSection from "@/components/side-menu/FilterSection";
import AuctionCard from "@/components/auction/AuctionCard";
import { useGetAuctions } from "@/hooks/queries/useGetAuctions";
import { useTopCategory } from "@/hooks/queries/useTopCategory";
import type { Auction, SearchAuctionsQuery } from "@/models/auction";
import { useState } from "react";
import { useSearchParams } from "react-router";

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get("category");

  const [filterParams, setFilterParams] = useState<SearchAuctionsQuery>({
    sort: "createdAt",
    category: currentCategory ?? undefined,
    search: "",
    minPrice: 0,
    maxPrice: 0,
  });

  const { data: topCategories, isLoading: isTopCategoriesLoading } =
    useTopCategory();

  const { data: auctions, isLoading: isAuctionsLoading } = useGetAuctions({
    sort: "createdAt",
    category: currentCategory ?? undefined,
    search: "",
    minPrice: 0,
    maxPrice: 0,
  });

  if (isAuctionsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex gap-6">
      {/* <SideMenu /> */}
      {/* 좌측 메뉴 */}
      <aside className="border-border w-64 shrink-0 border-r pr-6">
        <nav className="space-y-6">
          <AddAuctionButton />

          {/* 카테고리 섹션 */}
          <CategorySection
            isTopCategoriesLoading={isTopCategoriesLoading}
            topCategories={topCategories ?? []}
            currentCategory={currentCategory}
            setSearchParams={(params) => {
              setSearchParams(params);
              setFilterParams({ ...filterParams, ...params });
            }}
          />

          {/* 필터 섹션 */}
          <FilterSection
            setFilterParams={(params) =>
              setFilterParams({ ...filterParams, ...params })
            }
          />
        </nav>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1">
        <h1 className="text-foreground mb-6 text-2xl font-bold">경매 상품</h1>
        {auctions && Array.isArray(auctions) && auctions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction: Auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
            <p>등록된 경매 상품이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
