import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOpenProfileEditModal } from "@/stores/edit-profile-modal";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Pencil, User } from "lucide-react";

interface ProfileCardProps {
  name: string;
  nickname: string;
  email: string;
  createdAt: string;
}

export default function ProfileCard({
  name,
  nickname,
  email,
  createdAt,
}: ProfileCardProps) {
  const openProfileEditModal = useOpenProfileEditModal();

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy.MM.dd HH:mm", { locale: ko });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <User className="size-5" />
            프로필 정보
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => openProfileEditModal()}
            aria-label="프로필 수정"
          >
            <Pencil className="size-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-muted-foreground mb-1 text-sm">이름</div>
          <div className="font-semibold">{name}</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1 text-sm">닉네임</div>
          <div className="font-semibold">{nickname}</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1 text-sm">이메일</div>
          <div className="font-semibold">{email}</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1 text-sm">가입일</div>
          <div className="text-sm">{formatDate(createdAt)}</div>
        </div>
      </CardContent>
    </Card>
  );
}
