import { Outlet } from "react-router";
import Header from "@/components/header";

export default function DefaultLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="m-auto flex-1 border-x px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
