import { useSignupModal } from "@/stores/signup-modal";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useSignUp } from "@/hooks/mutations/auth/useSignUp";
import { Label } from "../ui/label";
import { emailRegex } from "@/lib/regRex";

export default function SignUpModal() {
  const openSignupModal = useSignupModal();

  const { mutate: signUp } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      openSignupModal.actions.close();
    }
  };

  const handleSubmit = () => {
    if (!email || !password || !name || !nickname) {
      toast.error("모든 필드를 입력해주세요", {
        position: "top-center",
      });
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다", {
        position: "top-center",
      });
      return;
    }
    if (!emailRegex.test(email)) {
      toast.error("이메일 형식이 올바르지 않습니다", {
        position: "top-center",
      });
      return;
    }
    signUp(
      { email, password, name, nickname },
      {
        onSuccess: (response) => {
          toast.success(response?.message, {
            position: "top-center",
          });
          if (response?.statusCode === 201) {
            openSignupModal.actions.close();
          }
        },
        onError: (error) => {
          console.log(error);
          toast.error(error.message, {
            position: "top-center",
          });
        },
      },
    );
  };

  useEffect(() => {
    return () => {
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setName("");
      setNickname("");
    };
  }, [openSignupModal.isOpen]);
  return (
    <Dialog open={openSignupModal.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원가입</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>이메일</Label>
            <Input
              type="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>비밀번호</Label>
            <Input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>비밀번호 확인</Label>
            <Input
              type="password"
              placeholder="비밀번호를 다시 입력해주세요"
              value={passwordConfirm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPasswordConfirm(e.target.value)
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>이름</Label>
            <Input
              type="text"
              placeholder="이름을 입력해주세요"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setName(e.target.value)
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>닉네임</Label>
            <Input
              type="text"
              placeholder="닉네임을 입력해주세요"
              value={nickname}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNickname(e.target.value)
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            회원가입
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
