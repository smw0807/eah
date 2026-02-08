import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight } from "lucide-react";
import { statusColors, statusLabels } from "@/lib/constants";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Auction {
  id: number;
  title: string;
  description: string;
  status: string;
  startPrice: string;
  currentPrice: string | null;
  imageUrl: string | null;
  category?: { name: string };
  subCategory?: { name: string };
  seller?: { nickname: string };
  winningBid?: { amount: string } | null;
  createdAt: string;
  endAt: string;
}

interface MyWonAuctionsProps {
  auctions: Auction[];
  limit?: number;
}

export default function MyWonAuctions({
  auctions,
  limit,
}: MyWonAuctionsProps) {
  const navigate = useNavigate();

  const formatPrice = (price: string | number | null) => {
    if (!price) return "0";
    return parseInt(String(price)).toLocaleString("ko-KR");
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy.MM.dd HH:mm", { locale: ko });
  };

  const displayedAuctions = limit
    ? auctions?.slice(0, limit) || []
    : auctions || [];
  const hasMore = limit ? auctions && auctions.length > limit : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5" />
          낙찰된 경매 ({auctions?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedAuctions.length > 0 ? (
          <div className="space-y-4">
            {displayedAuctions.map((auction) => (
              <div
                key={auction.id}
                className="group hover:bg-muted/50 flex cursor-pointer gap-4 rounded-lg border p-4 transition-all hover:shadow-md"
                onClick={() => navigate(`/auctions/${auction.id}`)}
              >
                {/* 이미지 */}
                <div className="bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                  {auction.imageUrl ? (
                    <img
                      src={auction.imageUrl}
                      alt={auction.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
                      <Trophy className="size-8 opacity-50" />
                    </div>
                  )}
                  {/* 낙찰 배지 */}
                  <div className="absolute top-1 left-1">
                    <span className="rounded-full bg-yellow-600 px-2 py-0.5 text-xs font-medium text-white">
                      낙찰
                    </span>
                  </div>
                  {/* 상태 배지 */}
                  <div className="absolute top-1 right-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[
                          auction.status as keyof typeof statusColors
                        ] || statusColors.CLOSED
                      }`}
                    >
                      {statusLabels[
                        auction.status as keyof typeof statusLabels
                      ] || auction.status}
                    </span>
                  </div>
                </div>

                {/* 경매 정보 */}
                <div className="flex flex-1 flex-col gap-2">
                  <div>
                    <h3 className="mb-1 font-semibold">{auction.title}</h3>
                    <p className="text-muted-foreground line-clamp-1 text-sm">
                      {auction.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {auction.category && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">카테고리:</span>{" "}
                        {auction.category.name} &gt; {auction.subCategory?.name}
                      </div>
                    )}
                    {auction.seller && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">판매자:</span>{" "}
                        {auction.seller.nickname}
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      <span className="font-medium">시작가:</span>{" "}
                      {formatPrice(auction.startPrice)}원
                    </div>
                    {auction.winningBid && (
                      <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                        <span className="text-muted-foreground font-medium">
                          낙찰가:
                        </span>{" "}
                        {formatPrice(auction.winningBid.amount)}원
                      </div>
                    )}
                  </div>

                  <div className="text-muted-foreground flex items-center gap-4 text-xs">
                    <div>
                      <span className="font-medium">종료일:</span>{" "}
                      {formatDate(auction.endAt)}
                    </div>
                    <div>
                      <span className="font-medium">등록일:</span>{" "}
                      {formatDate(auction.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/mypage/won-auctions")}
                >
                  더보기
                  <ChevronRight className="ml-2 size-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">
            낙찰된 경매가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
