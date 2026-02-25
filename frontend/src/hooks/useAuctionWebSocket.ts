import { useEffect, useRef, useState } from "react";
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
      reconnection: true,        // 자동 재연결 활성화
      reconnectionAttempts: 5,   // 최대 5회 재시도
      reconnectionDelay: 1000,   // 1초 후 재시도
      reconnectionDelayMax: 5000, // 최대 5초 간격
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

    // 경매 업데이트 수신 - setQueryData로 캐시를 직접 업데이트(별도 네트워크 요청 없음)
    socket.on("auctionUpdate", (update: AuctionUpdate) => {
      queryClient.setQueryData(
        ["auction", auctionId],
        (oldData: Record<string, unknown> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            currentPrice: update.currentPrice ?? oldData.currentPrice,
            status: update.status ?? oldData.status,
            winningBidId: update.winningBidId ?? oldData.winningBidId,
            bids: update.bids ?? oldData.bids,
          };
        },
      );
    });

    // 에러 처리 (재연결은 socket.io가 자동 처리)
    socket.on("connect_error", (error: Error) => {
      console.error("WebSocket 연결 오류:", error.message);
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
