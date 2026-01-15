import { useSigninModal } from "@/stores/signin-modal";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useState } from "react";
import { useSignIn } from "@/hooks/mutations/auth/useSignIn";
import { toast } from "sonner";
import { useOpenSignupModal } from "@/stores/signup-modal";

export default function SignInModal() {
  const openSignInModal = useSigninModal();
  const openSignUpModal = useOpenSignupModal();

  const { mutate: signIn } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  const handleSubmit = () => {
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요", {
        position: "top-center",
      });
      return;
    }
    signIn(
      { email, password },
      {
        onSuccess: () => {
          toast.success("로그인 성공", {
            position: "top-center",
          });
          openSignInModal.actions.close();
        },
      },
    );
  };
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      openSignInModal.actions.close();
    }
  };
  return (
    <Dialog open={openSignInModal.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={handleEmailChange}
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={handlePasswordChange}
          />
        </div>
        <DialogFooter>
          <div className="flex w-full flex-col gap-2">
            <Button type="submit" onClick={handleSubmit}>
              로그인
            </Button>
            <Button variant="outline" onClick={openSignUpModal}>
              회원가입
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
