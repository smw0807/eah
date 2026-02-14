import { useGetAuction } from "@/hooks/queries/auction/useGetAuction";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Clock,
  User,
  Tag,
  Calendar,
  TrendingUp,
  ShoppingCart,
  ArrowLeft,
  Wifi,
  WifiOff,
  Edit,
  X,
} from "lucide-react";
import type { Auction, Bid } from "@/models/auction";
import { statusColors, statusLabels } from "@/lib/constants";
import { useAuctionWebSocket } from "@/hooks/useAuctionWebSocket";
import { toastError, toastSuccess } from "@/lib/toast";
import { useOpenBidModal, useBidModalActions } from "@/stores/bid-modal";
import { useOpenAlertModal } from "@/stores/alert-modal";
import { useCreateBuyout } from "@/hooks/mutations/bid/useCreateBuyout";
import { useGetCurrentUser } from "@/hooks/queries/auth/useGetCurrentUser";
import { useCancelAuction } from "@/hooks/mutations/auction/useCancelAuction";

export default function AuctionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const auctionId = Number(id);

  const openBidModal = useOpenBidModal();
  const { setCurrentPrice, setMinBidStep, setNextBidAmount, setAuctionId } =
    useBidModalActions();

  const openAlertModal = useOpenAlertModal();

  const { data: auction, isLoading: isAuctionLoading } =
    useGetAuction(auctionId);
  const { mutate: createBuyout } = useCreateBuyout({
    onSuccess: (response) => {
      if (response && response.statusCode === 400) {
        toastError(response.message as string);
        return;
      } else {
        toastSuccess("즉시구매가 완료되었습니다.");
      }
    },
    onError: (error) => {
      toastError(error.message);
    },
  });
  const { mutate: cancelAuction } = useCancelAuction({
    onSuccess: (response) => {
      if (response && response.statusCode === 400) {
        toastError(response.message as string);
        return;
      } else {
        toastSuccess("경매가 취소되었습니다.");
      }
    },
    onError: (error) => {
      toastError(error.message);
    },
  });

  const { data: user } = useGetCurrentUser();
  // WebSocket 연결 (실시간 업데이트)
  const { isConnected } = useAuctionWebSocket(auctionId);

  // 판매자 본인인지 확인
  const isSeller = user?.id === auction?.sellerId;

  if (isAuctionLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">
          경매 상품을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const formatPrice = (price: string | null) => {
    if (!price) return "0";
    return parseInt(price).toLocaleString("ko-KR");
  };

  const getTimeRemaining = (endAt: string) => {
    const endDate = new Date(endAt);
    const now = new Date();
    if (endDate < now) return "종료됨";
    return formatDistanceToNow(endDate, { addSuffix: true, locale: ko });
  };

  const getNextBidAmount = (auction: Auction) => {
    const currentPrice = auction.currentPrice
      ? parseInt(auction.currentPrice)
      : parseInt(auction.startPrice);
    const minBidStep = parseInt(auction.minBidStep);
    return currentPrice + minBidStep;
  };

  const handleBid = () => {
    if (!isConnected) {
      toastError("연결이 되지 않아 입찰을 할 수 없습니다.");
      return;
    }
    setCurrentPrice(parseInt(auction.currentPrice || auction.startPrice));
    setMinBidStep(parseInt(auction.minBidStep));
    setNextBidAmount(getNextBidAmount(auction));
    setAuctionId(auctionId);
    openBidModal();
  };

  const handleBuyout = () => {
    if (!isConnected) {
      toastError("연결이 되지 않아 즉시구매를 할 수 없습니다.");
      return;
    }
    openAlertModal({
      title: "즉시구매",
      description: `즉시구매를 하시겠습니까?<br/><br/><span class='font-bold text-lg text-red-500'>즉시구매 가격: ${formatPrice(auction.buyoutPrice)}원</span>`,
      onPositive: () => {
        createBuyout(auctionId);
      },
    });
    return;
  };

  // 경매 수정
  const handleEditAuction = () => {
    // TODO: 경매 수정 기능 구현
    if (auction.status === "CLOSED") {
      toastError("경매 상태가 종료되었으면 수정할 수 없습니다.");
      return;
    }
    if (auction.status === "CANCELED") {
      toastError("경매 상태가 취소되었으면 수정할 수 없습니다.");
      return;
    }
    openAlertModal({
      title: "경매 수정",
      description: "경매를 수정하시겠습니까?",
      onPositive: () => {
        navigate(`/auction/update/${auctionId}`);
      },
    });
  };

  // 경매 취소
  const handleCancelAuction = () => {
    openAlertModal({
      title: "경매 취소",
      description: "경매를 취소하시겠습니까?",
      onPositive: () => {
        cancelAuction(auctionId);
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex flex-col items-end">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
          뒤로가기
        </Button>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* 좌측: 이미지 */}
        <div className="space-y-4">
          <div className="bg-muted relative aspect-square w-full overflow-hidden rounded-xl border">
            {auction.imageUrl ? (
              <img
                src={auction.imageUrl}
                alt={auction.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                <Tag className="size-24 opacity-50" />
              </div>
            )}
            {/* 상태 배지 */}
            <div className="absolute top-4 left-4">
              <span
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  statusColors[auction.status as keyof typeof statusColors] ||
                  statusColors.CLOSED
                }`}
              >
                {statusLabels[auction.status as keyof typeof statusLabels] ||
                  auction.status}
              </span>
            </div>
          </div>
        </div>

        {/* 우측: 상품 정보 */}
        <div className="space-y-6">
          {/* 제목 및 카테고리 */}
          <div className="space-y-4">
            <div>
              <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="size-4" />
                  <span>
                    {auction.category.name} &gt; {auction.subCategory.name}
                  </span>
                </div>
                {/* 실시간 연결 상태 표시 */}
                <div className="flex items-center gap-1.5 text-xs">
                  {isConnected ? (
                    <>
                      <Wifi className="size-3.5 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">
                        실시간 연결됨
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="size-3.5 text-gray-400" />
                      <span>연결 중...</span>
                    </>
                  )}
                </div>
              </div>
              <h1 className="text-3xl font-bold">{auction.title}</h1>
            </div>

            {/* 판매자 정보 */}
            <div className="text-muted-foreground flex items-center gap-2">
              <User className="size-4" />
              <span className="text-sm">판매자: {auction.seller.nickname}</span>
            </div>
          </div>

          {/* 가격 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle>가격 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 flex items-center justify-between rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-muted-foreground size-5" />
                  <span className="text-muted-foreground">현재가</span>
                </div>
                <span className="text-primary text-2xl font-bold">
                  {formatPrice(auction.currentPrice || auction.startPrice)}원
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <div className="text-muted-foreground mb-1 text-sm">
                    시작가
                  </div>
                  <div className="text-lg font-semibold">
                    {formatPrice(auction.startPrice)}원
                  </div>
                </div>
                {auction.buyoutPrice && (
                  <div className="rounded-lg border p-4">
                    <div className="text-muted-foreground mb-1 text-sm">
                      즉시구매가
                    </div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatPrice(auction.buyoutPrice)}원
                    </div>
                  </div>
                )}
              </div>

              <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
                <div className="text-muted-foreground mb-1 text-sm">
                  다음 입찰가
                </div>
                <div className="text-primary text-xl font-bold">
                  {formatPrice(getNextBidAmount(auction).toString())}원
                </div>
                <div className="text-muted-foreground mt-1 text-xs">
                  (최소 입찰 단위: {formatPrice(auction.minBidStep)}원)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 경매 시간 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>경매 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="text-muted-foreground size-5" />
                <div>
                  <div className="text-muted-foreground text-sm">남은 시간</div>
                  <div className="font-semibold">
                    {getTimeRemaining(auction.endAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-muted-foreground size-5" />
                <div>
                  <div className="text-muted-foreground text-sm">경매 기간</div>
                  <div className="font-semibold">
                    {new Date(auction.startAt).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" ~ "}
                    {new Date(auction.endAt).toLocaleString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 판매자용 버튼 (경매 취소, 수정) */}
          {isSeller &&
            (auction.status === "OPEN" || auction.status === "SCHEDULED") && (
              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={handleEditAuction}
                >
                  <Edit className="size-5" />
                  경매 수정
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="flex-1"
                  onClick={handleCancelAuction}
                >
                  <X className="size-5" />
                  경매 취소
                </Button>
              </div>
            )}

          {/* 입찰 버튼 */}
          {auction.status === "OPEN" && !isSeller && (
            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={handleBid}>
                <TrendingUp className="size-5" />
                입찰하기
              </Button>
              {auction.buyoutPrice && (
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={handleBuyout}
                >
                  <ShoppingCart className="size-5" />
                  즉시구매
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 하단: 상품 설명 및 입찰 내역 */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* 상품 설명 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>상품 설명</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground whitespace-pre-wrap">
              {auction.description}
            </div>
          </CardContent>
        </Card>

        {/* 입찰 내역 */}
        <Card>
          <CardHeader>
            <CardTitle>입찰 내역</CardTitle>
          </CardHeader>
          <CardContent>
            {auction.bids && auction.bids.length > 0 ? (
              <div className="space-y-3">
                {auction.bids.map((bid: Bid) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-semibold">
                        {formatPrice(bid.amount.toString())}원
                      </div>
                      <div className="text-muted-foreground text-xs">
                        입찰자 #{bid.bidderId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                아직 입찰이 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
