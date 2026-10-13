import { io, Socket } from 'socket.io-client';
import { config } from '@/07-shared/config/config';

// Socket.io 클라이언트 싱글톤 인스턴스 보관함
let socket: Socket | null = null;

/**
 * Socket.io 클라이언트 싱글톤 반환함
 * 주소는 config에서 정하고 중복 연결 방지 처리함
 */
export const getSocket = (): Socket => {
  if (!socket) {
    // WebSocket 전용 transport 사용함
    socket = io(config.api.socketUrl ?? config.api.baseUrl, {
      transports: ['websocket'],
    });
  }
  return socket;
};
