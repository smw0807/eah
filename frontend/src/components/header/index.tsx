import logoText from "@/assets/EAH.png";
import SignInButton from "./SignInButton";
import { useAuthIsAuthenticated } from "@/stores/auth";
import MyPageButton from "./MyPageButton";
import LogoutButton from "./LogoutButton";
import { useNavigate } from "react-router";
export default function Header() {
  const isAuthenticated = useAuthIsAuthenticated();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/");
  };

  return (
    <header className="border-border bg-background sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* 중앙 제목 */}
          <h1 className="text-foreground flex items-center gap-2 text-xl font-semibold">
            <img
              src={logoText}
              alt="logo"
              className="size-30"
              onClick={handleClick}
            />
          </h1>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <MyPageButton /> <LogoutButton />
            </div>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}
