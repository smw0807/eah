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
import { Label } from "../ui/label";
import { useProfileEditModal } from "@/stores/edit-profile-modal";
import { useUpdateProfile } from "@/hooks/mutations/user/useUpdateProfile";
import { useGetMyProfile } from "@/hooks/queries/user/useGetMyProfile";
import { useAlertModal } from "@/stores/alert-modal";
import { toastError, toastSuccess } from "@/lib/toast";

export default function EditProfileModal() {
  const openProfileEditModal = useProfileEditModal();
  const openAlertModal = useAlertModal();

  const { data: myProfile } = useGetMyProfile();
  const { mutate: updateMyProfile } = useUpdateProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      openProfileEditModal.actions.close();
    }
  };

  const handleSubmit = () => {
    if (!name || !nickname) {
      toast.error("모든 필드를 입력해주세요", {
        position: "top-center",
      });
      return;
    }
    if (password && password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다", {
        position: "top-center",
      });
      return;
    }

    openAlertModal.actions.open({
      title: "회원정보 수정",
      description: "회원정보를 수정하시겠습니까?",
      onPositive: () => {
        updateMyProfile({ email, password, name, nickname }, {
          onSuccess: (response) => {
            if (response && response.statusCode === 400) {
              toastError(response.message as string);
              return;
            }
            toastSuccess('회원정보가 수정되었습니다');
            openProfileEditModal.actions.close();
          },
          onError: (error) => {
            toastError(error.message);
          },
        });
      },
    });
  };

  useEffect(() => {
    return () => {
      setEmail(myProfile?.email || "");
      setPassword("");
      setPasswordConfirm("");
      setName(myProfile?.name || "");
      setNickname(myProfile?.nickname || "");
    };
  }, [openProfileEditModal.isOpen]);
  return (
    <Dialog open={openProfileEditModal.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>회원정보 수정</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>이메일</Label>
            <Input
              type="email"
              placeholder="example@example.com"
              value={email}
              disabled
            />
            <p className="text-sm text-gray-500">이메일은 수정할 수 없습니다</p>
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
            <p className="text-sm text-gray-500">비밀번호를 입력하면 비밀번호가 변경됩니다</p>
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
            <p className="text-sm text-gray-500">비밀번호를 입력하면 비밀번호가 변경됩니다</p>
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
            수정하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
