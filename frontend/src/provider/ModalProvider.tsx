import SignInModal from "@/components/modal/SignInModal";
import { createPortal } from "react-dom";

export default function ModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {createPortal(
        <>
          <SignInModal />
        </>,
        document.getElementById("modal-root")!,
      )}
      {children}
    </>
  );
}
