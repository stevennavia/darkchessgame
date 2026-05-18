declare module "colyseus.js" {
  export class Client {
    constructor(endpoint: string);
    create(roomName: string, options?: any): Promise<Room>;
    join(roomName: string, options?: any): Promise<Room>;
    joinById(roomId: string, options?: any): Promise<Room>;
    joinOrCreate(roomName: string, options?: any): Promise<Room>;
    reconnect(roomId: string, sessionId: string): Promise<Room>;
  }

  export class Room {
    roomId: string;
    sessionId: string;
    onStateChange(callback: (state: any) => void): void;
    onMessage<T = any>(type: string, callback: (data: T) => void): void;
    onLeave(callback: (code: number) => void): void;
    send(type: string, data?: any): void;
    leave(): void;
  }
}
