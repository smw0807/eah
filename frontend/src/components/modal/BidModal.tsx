import { useState, useEffect } from "react";
import { useBidModal } from "@/stores/bid-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useCreateBid } from "@/hooks/mutations/bid/useCreateBid";
import { toastSuccess, toastError } from "@/lib/toast";
import { TrendingUp, Plus, Minus } from "lucide-react";

export default function BidModal() {
  const bidModal = useBidModal();
  const { currentPrice, minBidStep, nextBidAmount } = bidModal;
  const auctionId = Number(bidModal.auctionId);

  const [bidAmount, setBidAmount] = useState(nextBidAmount);
  const [isCustomAmount, setIsCustomAmount] = useState(false);

  // nextBidAmount가 변경되면 bidAmount도 업데이트 (커스텀 금액이 아닐 때만)
  useEffect(() => {
    if (!isCustomAmount) {
      setBidAmount(nextBidAmount);
    }
  }, [nextBidAmount, isCustomAmount]);

  const { mutate: createBid, isPending } = useCreateBid({
    onSuccess: () => {
      toastSuccess("입찰이 완료되었습니다.");
      bidModal.actions.close();
      setBidAmount(nextBidAmount);
      setIsCustomAmount(false);
    },
    onError: (error: any) => {
      toastError(error?.message || "입찰에 실패했습니다.");
    },
  });

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  const handleQuickBid = () => {
    setBidAmount(nextBidAmount);
    setIsCustomAmount(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, "");
    const numValue = parseInt(value) || 0;
    setBidAmount(numValue);
    setIsCustomAmount(true);
  };

  const handleIncrement = () => {
    const newAmount = bidAmount + minBidStep;
    setBidAmount(newAmount);
    setIsCustomAmount(true);
  };

  const handleDecrement = () => {
    const newAmount = Math.max(nextBidAmount, bidAmount - minBidStep);
    setBidAmount(newAmount);
    setIsCustomAmount(true);
  };

  const handleSubmit = () => {
    if (bidAmount < nextBidAmount) {
      toastError(`최소 입찰 금액은 ${formatPrice(nextBidAmount)}원입니다.`);
      return;
    }

    if (bidAmount % 100 !== 0) {
      toastError("입찰 금액은 100원 단위로 입력해주세요.");
      return;
    }

    if (bidAmount > 1000000000) {
      toastError("입찰 금액은 10억원을 초과할 수 없습니다.");
      return;
    }

    createBid({ auctionId, amount: bidAmount });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      bidModal.actions.close();
      setBidAmount(nextBidAmount);
      setIsCustomAmount(false);
    }
  };

  return (
    <Dialog open={bidModal.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>입찰하기</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 현재가 정보 */}
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="text-muted-foreground mb-2 text-sm">현재가</div>
              <div className="text-primary text-2xl font-bold">
                {formatPrice(currentPrice)}원
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground mb-1 text-xs">
                  최소 입찰 단위
                </div>
                <div className="font-semibold">{formatPrice(minBidStep)}원</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-muted-foreground mb-1 text-xs">
                  다음 입찰가
                </div>
                <div className="font-semibold text-green-600 dark:text-green-400">
                  {formatPrice(nextBidAmount)}원
                </div>
              </div>
            </div>
          </div>

          {/* 입찰 금액 입력 */}
          <div className="space-y-3">
            <Label htmlFor="bidAmount">입찰 금액</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="bidAmount"
                  type="text"
                  value={formatPrice(bidAmount)}
                  onChange={handleAmountChange}
                  placeholder="입찰 금액을 입력하세요"
                  className="pr-20"
                />
                <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                  원
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleDecrement}
                  disabled={bidAmount <= nextBidAmount}
                >
                  <Minus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleIncrement}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {/* 빠른 입찰 버튼 */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleQuickBid}
            >
              <TrendingUp className="size-4" />
              다음 입찰가로 입찰 ({formatPrice(nextBidAmount)}원)
            </Button>

            {/* 입찰 금액 안내 */}
            <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-xs">
              <p>• 최소 입찰 금액: {formatPrice(nextBidAmount)}원</p>
              <p>• 입찰 금액은 100원 단위로 입력 가능합니다.</p>
              <p>• 입찰 후 취소할 수 없으니 신중히 결정해주세요.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || bidAmount < nextBidAmount}
            className="min-w-24"
          >
            {isPending ? "입찰 중..." : "입찰하기"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
