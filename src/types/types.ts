export type Context = 'background' | 'sidepanel' | `content-${number}`;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface BaseMessage {
  type: string;
  payload: unknown;
  source: Context;
  target: Context;
  timestamp: number;
}

export type MessageHandler<T extends BaseMessage = BaseMessage> = (message: T) => void;
