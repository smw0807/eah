import { useGetMyProfile } from "@/hooks/queries/user/useGetMyProfile";
import { useGetMySales } from "@/hooks/queries/user/useGetMySales";
import { useGetMyBids } from "@/hooks/queries/user/useGetMyBids";
import { useGetMyAccount } from "@/hooks/queries/user/useGetMyAccount";
import { useGetMyBidAuctions } from "@/hooks/queries/user/useGetMyBidAuctions";
import ProfileCard from "@/components/mypage/ProfileCard";
import AccountCard from "@/components/mypage/AccountCard";
import MySalesList from "@/components/mypage/MySalesList";
import MyBidsList from "@/components/mypage/MyBidsList";
import MyWonAuctions from "@/components/mypage/MyWonAuctions";

export default function MyPage() {
  const { data: myProfile, isLoading: isProfileLoading } = useGetMyProfile();
  const { data: mySales, isLoading: isSalesLoading } = useGetMySales();
  const { data: myBids, isLoading: isBidsLoading } = useGetMyBids();
  const { data: myAccount, isLoading: isAccountLoading } = useGetMyAccount();
  const { data: myBidAuctions, isLoading: isBidAuctionsLoading } =
    useGetMyBidAuctions();

  if (
    isProfileLoading ||
    isSalesLoading ||
    isBidsLoading ||
    isAccountLoading ||
    isBidAuctionsLoading
  ) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!myProfile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">
          프로필을 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">마이페이지</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 좌측: 프로필 및 계좌 정보 */}
        <div className="space-y-6 lg:col-span-1">
          <ProfileCard
            name={myProfile.name}
            nickname={myProfile.nickname}
            email={myProfile.email}
            createdAt={myProfile.createdAt}
          />
          <AccountCard
            currentAmount={myAccount?.currentAmount || "0"}
            lockedAmount={myAccount?.lockedAmount || "0"}
          />
        </div>

        {/* 우측: 판매 내역, 입찰 내역, 낙찰된 경매 */}
        <div className="space-y-6 lg:col-span-2">
          <MyWonAuctions auctions={myBidAuctions || []} limit={3} />
          <MySalesList sales={mySales || []} limit={3} />
          <MyBidsList bids={myBids || []} limit={3} />
        </div>
      </div>
    </div>
  );
}
