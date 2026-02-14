import DefaultLayout from "@/layouts/default";
import UserLayout from "@/layouts/UserLayout";
import Home from "@/pages";
import CreateAuction from "@/pages/auction/CreateAuction";
import AuctionDetail from "@/pages/auction/Detail";
import UpdateAuction from "@/pages/auction/UpdateAuction";
import MyPage from "@/pages/mypage/MyPage";
import MySalesPage from "@/pages/mypage/MySalesPage";
import MyBidsPage from "@/pages/mypage/MyBidsPage";
import MyWonAuctionsPage from "@/pages/mypage/MyWonAuctionsPage";
import { Route, Routes } from "react-router";
export default function Router() {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<Home />} />

        <Route element={<UserLayout />}>
          <Route path="/auction/create" element={<CreateAuction />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route path="/auction/update/:id" element={<UpdateAuction />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/sales" element={<MySalesPage />} />
          <Route path="/mypage/bids" element={<MyBidsPage />} />
          <Route path="/mypage/won-auctions" element={<MyWonAuctionsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
