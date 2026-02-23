import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuthService } from 'src/auth/auth.service';
import { AuctionStatus, Bid } from 'generated/prisma/client';

interface AuctionUpdatePayload {
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

@WebSocketGateway({
  cors: {
    // CORS_ORIGIN은 Joi 스키마에서 required()로 강제되므로 항상 설정됨
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
  namespace: '/bid',
})
export class AuctionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AuctionsGateway.name);
  private readonly connectedClients = new Map<string, Set<number>>(); // userId -> Set<auctionIds>

  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly authService: AuthService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token || typeof token !== 'string') {
        this.logger.warn(`Client ${client.id} 연결 실패: 토큰 없음`);
        client.disconnect();
        return;
      }

      const payload = this.authService.verifyToken(token);

      client.data.userId = payload.id;
      this.logger.log(`Client ${client.id} 연결됨 (userId: ${payload.id})`);
    } catch (error: any) {
      this.logger.warn(
        `Client ${client.id} 연결 실패: ${error?.message || 'Unknown error'}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as number | undefined;
    if (userId && this.connectedClients.has(String(userId))) {
      this.connectedClients.delete(String(userId));
    }
    this.logger.log(`Client ${client.id} 연결 해제됨`);
  }

  @SubscribeMessage('joinAuction')
  async handleJoinAuction(
    @MessageBody() data: { auctionId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId as number | undefined;
    if (!userId) {
      return { error: '인증이 필요합니다.' };
    }

    const auctionId = Number(data.auctionId);
    const room = `auction:${auctionId}`;

    // 방에 조인
    await client.join(room);

    // 사용자가 조인한 경매 목록에 추가
    if (!this.connectedClients.has(String(userId))) {
      this.connectedClients.set(String(userId), new Set());
    }
    this.connectedClients.get(String(userId))?.add(auctionId);

    this.logger.log(
      `User ${userId} joined auction room: ${room} (client: ${client.id})`,
    );

    return { success: true, auctionId };
  }

  @SubscribeMessage('leaveAuction')
  async handleLeaveAuction(
    @MessageBody() data: { auctionId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId as number | undefined;
    if (!userId) return { error: '인증이 필요합니다.' };

    const auctionId = Number(data.auctionId);
    const room = `auction:${auctionId}`;

    await client.leave(room);

    // 사용자가 조인한 경매 목록에서 제거
    const userAuctions = this.connectedClients.get(String(userId));
    if (userAuctions) {
      userAuctions.delete(auctionId);
      if (userAuctions.size === 0) {
        this.connectedClients.delete(String(userId));
      }
    }

    this.logger.log(
      `User ${userId} left auction room: ${room} (client: ${client.id})`,
    );

    return { success: true, auctionId };
  }

  // 경매 업데이트를 해당 경매 방에 브로드캐스트
  broadcastAuctionUpdate(auctionId: number, update: AuctionUpdatePayload) {
    const room = `auction:${auctionId}`;
    this.server.to(room).emit('auctionUpdate', update);
    this.logger.log(`Broadcasted update to room ${room}:`, update);
  }

  // 입찰 발생 시 업데이트 브로드캐스트
  async handleBidCreated(auctionId: number) {
    const auction = await this.auctionsService.getAuctionDetail(auctionId);
    if (!auction) return;
    // getAuctionDetail은 bids를 include하지만 반환 타입이 Auction이므로 명시적 단언
    const rawBids = (auction as typeof auction & { bids: Bid[] }).bids ?? [];
    const bids = rawBids.map((b) => ({
      id: b.id,
      auctionId: b.auctionId,
      bidderId: b.bidderId,
      amount: b.amount.toNumber(),
    }));

    this.broadcastAuctionUpdate(auctionId, {
      auctionId,
      currentPrice: auction.currentPrice?.toString() || undefined,
      bids,
      status: auction.status,
      winningBidId: auction.winningBidId,
    });
  }

  // 경매 상태 변경 시 업데이트 브로드캐스트
  async handleAuctionStatusChange(auctionId: number, status: AuctionStatus) {
    const auction = await this.auctionsService.getAuctionDetail(auctionId);
    if (!auction) return;

    this.broadcastAuctionUpdate(auctionId, {
      auctionId,
      status,
      currentPrice: auction.currentPrice?.toString() || undefined,
      winningBidId: auction.winningBidId,
    });
  }
}
