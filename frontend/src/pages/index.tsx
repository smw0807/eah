import AddAuctionButton from "@/components/side-menu/AddAuctionButton";
import CategorySection from "@/components/side-menu/CategorySection";
import FilterSection from "@/components/side-menu/FilterSection";
import AuctionCard from "@/components/auction/AuctionCard";
import { useGetAuctions } from "@/hooks/queries/auction/useGetAuctions";
import { useTopCategory } from "@/hooks/queries/useTopCategory";
import type { Auction, SearchAuctionsQuery } from "@/models/auction";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useInView } from "react-intersection-observer";

type AuctionFilters = Omit<SearchAuctionsQuery, "page" | "limit">;

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get("category");

  const [filterParams, setFilterParams] = useState<AuctionFilters>({
    sort: "createdAt",
    category: currentCategory ?? "",
    search: "",
    minPrice: 0,
    maxPrice: 0,
    status: "",
  });

  const { data: topCategories, isLoading: isTopCategoriesLoading } =
    useTopCategory();

  const {
    data,
    isLoading: isAuctionsLoading,
    isError: isAuctionsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAuctions(filterParams);

  const auctionList = data?.pages.flatMap((page) => page.data) ?? [];

  // 스크롤 끝 감지 센티넬
  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isAuctionsLoading) {
    return <div>Loading...</div>;
  }

  if (isAuctionsError) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p>경매 목록을 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
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
        {auctionList.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {auctionList.map((auction: Auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>

            {/* 무한 스크롤 센티넬 */}
            <div ref={sentinelRef} className="mt-6 flex justify-center">
              {isFetchingNextPage && (
                <p className="text-muted-foreground text-sm">불러오는 중...</p>
              )}
              {!hasNextPage && auctionList.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  모든 상품을 불러왔습니다.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
            <p>등록된 경매 상품이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
