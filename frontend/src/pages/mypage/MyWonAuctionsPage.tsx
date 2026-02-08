import { useGetMyBidAuctions } from "@/hooks/queries/user/useGetMyBidAuctions";
import MyWonAuctions from "@/components/mypage/MyWonAuctions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function MyWonAuctionsPage() {
  const { data: myBidAuctions, isLoading } = useGetMyBidAuctions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/mypage")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-3xl font-bold">낙찰된 경매</h1>
      </div>

      <MyWonAuctions auctions={myBidAuctions || []} />
    </div>
  );
}
