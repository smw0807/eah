import { toast } from "sonner";

export function toastSuccess(message: string) {
  toast.success(message, {
    position: "top-center",
    duration: 3000,
    icon: "🎉",
    className: "bg-green-500 text-white",
  });
}

export function toastWarning(message: string) {
  toast.warning(message, {
    position: "top-center",
    duration: 3000,
    icon: "🚨",
    className: "bg-yellow-500 text-white",
  });
}

export function toastError(message: string) {
  toast.error(message, {
    position: "top-center",
    duration: 3000,
    icon: "🚨",
    className: "bg-red-500 text-white",
    style: {
      backgroundColor: "#ff0000",
      color: "#ffffff",
    },
  });
}
