import { useEffect, useRef, useState } from "react";
// @ts-ignore - socket.io-client will be installed
import { io, Socket } from "socket.io-client";
import { useAuthState } from "@/stores/auth";
import { useQueryClient } from "@tanstack/react-query";

interface AuctionUpdate {
  auctionId: number;
  currentPrice?: string;
  bids?: Array<{
    id: number;
    auctionId: number;
    bidderId: number;
    amount: number;
  }>;
  status?: string;
  winningBidId?: number | null;
}

export function useAuctionWebSocket(auctionId: number | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { accessToken } = useAuthState();

  useEffect(() => {
    if (!auctionId || !accessToken) {
      return;
    }

    // WebSocket 연결
    const socket = io(`${import.meta.env.VITE_WS_URL}`, {
      auth: {
        token: accessToken,
      },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // 연결 성공
    socket.on("connect", () => {
      setIsConnected(true);
      // 경매 방에 조인
      socket.emit("joinAuction", { auctionId });
    });

    // 연결 해제
    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // 경매 업데이트 수신
    socket.on("auctionUpdate", (update: AuctionUpdate) => {
      // React Query 캐시 업데이트
      queryClient.setQueryData(["auction", auctionId], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          currentPrice: update.currentPrice ?? oldData.currentPrice,
          status: update.status ?? oldData.status,
          winningBidId: update.winningBidId ?? oldData.winningBidId,
          bids: update.bids ?? oldData.bids,
        };
      });

      // 입찰 목록 쿼리도 무효화하여 재조회
      queryClient.invalidateQueries({
        queryKey: ["auction", auctionId],
      });
    });

    // 에러 처리
    socket.on("connect_error", (error: Error) => {
      console.error("WebSocket 연결 오류:", error);
      setIsConnected(false);
    });

    // 정리 함수
    return () => {
      if (socket.connected) {
        socket.emit("leaveAuction", { auctionId });
      }
      socket.disconnect();
    };
  }, [auctionId, accessToken, queryClient]);

  return { isConnected, socket: socketRef.current };
}
