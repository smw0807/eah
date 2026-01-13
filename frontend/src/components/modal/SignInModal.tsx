import { useSigninModal } from "@/stores/signin-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Form, FormControl, FormItem, FormLabel } from "../ui/form";
import { useForm } from "react-hook-form";
import type { SignInInput } from "@/models/auth";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function SignInModal() {
  const openSignInModal = useSigninModal();
  const form = useForm<SignInInput>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
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
        <DialogDescription>
          <Form {...form}>
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input type="email" {...form.register("email")} />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input type="password" {...form.register("password")} />
              </FormControl>
            </FormItem>
          </Form>
        </DialogDescription>
        <DialogFooter>
          <div className="flex w-full flex-col gap-2">
            <Button type="submit">로그인</Button>
            <Button variant="outline" onClick={() => {}}>
              회원가입
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
