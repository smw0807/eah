import { useSignupModal } from "@/stores/signup-modal";
import { useState } from "react";
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

export default function SignUpModal() {
  const openSignupModal = useSignupModal();

  const { mutate: signUp } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
  return (
    <Dialog open={openSignupModal.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원가입</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
          />
          <Input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
          />
          <Input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNickname(e.target.value)
            }
          />
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
