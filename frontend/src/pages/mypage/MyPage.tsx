import { useGetMyProfile } from "@/hooks/queries/user/useGetMyProfile";
import { useGetMySales } from "@/hooks/queries/user/useGetMySales";
import { useGetMyBids } from "@/hooks/queries/user/useGetMyBids";
import { useGetMyAccount } from "@/hooks/queries/user/useGetMyAccount";
export default function MyPage() {
  const { data: myProfile } = useGetMyProfile();
  const { data: mySales } = useGetMySales();
  const { data: myBids } = useGetMyBids();
  const { data: myAccount } = useGetMyAccount();
  console.log(myProfile, mySales, myBids, myAccount);
  return <div>MyPage</div>;
}
