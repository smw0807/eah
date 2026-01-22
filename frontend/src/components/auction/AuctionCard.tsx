import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { Auction } from "@/models/auction";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Clock, User, Tag } from "lucide-react";
import { Link } from "react-router";

interface AuctionCardProps {
  auction: Auction;
}

const statusColors = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  CANCELED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels = {
  SCHEDULED: "예정",
  OPEN: "진행중",
  CLOSED: "종료",
  CANCELED: "취소",
};

export default function AuctionCard({ auction }: AuctionCardProps) {
  const formatPrice = (price: string | null) => {
    if (!price) return "0";
    return parseInt(price).toLocaleString("ko-KR");
  };

  const getTimeRemaining = () => {
    const endDate = new Date(auction.endAt);
    const now = new Date();
    if (endDate < now) return "종료됨";
    return formatDistanceToNow(endDate, { addSuffix: true, locale: ko });
  };

  return (
    <Link to={`/auctions/${auction.id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg">
        {/* 이미지 영역 */}
        <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-t-xl">
          {auction.imageUrl ? (
            <img
              src={auction.imageUrl}
              alt={auction.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
              <Tag className="size-12 opacity-50" />
            </div>
          )}
          {/* 상태 배지 */}
          <div className="absolute top-2 right-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                statusColors[auction.status as keyof typeof statusColors] ||
                statusColors.CLOSED
              }`}
            >
              {statusLabels[auction.status as keyof typeof statusLabels] ||
                auction.status}
            </span>
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-lg leading-tight font-semibold">
              {auction.title}
            </h3>
          </div>
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {auction.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 카테고리 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Tag className="size-4" />
            <span>
              {auction.category.name} &gt; {auction.subCategory.name}
            </span>
          </div>

          {/* 판매자 */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <User className="size-4" />
            <span>{auction.seller.nickname}</span>
          </div>

          {/* 가격 정보 */}
          <div className="bg-muted/50 space-y-1.5 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">시작가</span>
              <span className="font-semibold">
                {formatPrice(auction.startPrice)}원
              </span>
            </div>
            {auction.currentPrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">현재가</span>
                <span className="text-primary font-semibold">
                  {formatPrice(auction.currentPrice)}원
                </span>
              </div>
            )}
            {auction.buyoutPrice && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">즉시구매가</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatPrice(auction.buyoutPrice)}원
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="text-muted-foreground flex items-center justify-between border-t pt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>{getTimeRemaining()}</span>
          </div>
          <span>
            {new Date(auction.startAt).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            })}
            {" ~ "}
            {new Date(auction.endAt).toLocaleDateString("ko-KR", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
