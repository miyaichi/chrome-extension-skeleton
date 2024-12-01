// connectionManager.ts
import { BaseMessage, ConnectionStatus, Context, MessageHandler } from '../types/types';
import { Logger } from './logger';

export class ConnectionManager {
  private port: chrome.runtime.Port | null = null;
  private status: ConnectionStatus = 'disconnected';
  private readonly maxReconnectAttempts = 3;
  private reconnectAttempts = 0;
  private readonly logger: Logger;
  private readonly messageHandler: MessageHandler | null = null;

  constructor(
    private readonly context: Context,
    private readonly onMessage?: MessageHandler,
    logger?: Logger
  ) {
    this.logger = logger ?? new Logger(context);
    this.messageHandler = onMessage ?? null;
  }

  /**
   * Get the current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Connect to the extension
   */
  connect(): chrome.runtime.Port {
    try {
      this.status = 'connecting';
      this.disconnectExisting();

      this.port = chrome.runtime.connect({ name: this.context });
      this.setupConnectionHandlers();

      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.logger.debug('Connected successfully');

      return this.port;
    } catch (error) {
      this.handleConnectionError(error);
      throw error;
    }
  }

  /**
   * Send a message to the target
   */
  async sendMessage<T extends BaseMessage>(
    target: Context,
    messageData: Omit<T, 'source' | 'target' | 'timestamp'>
  ): Promise<void> {
    if (!this.port || this.status !== 'connected') {
      throw new Error('No active connection');
    }

    try {
      const message = {
        ...messageData,
        source: this.context,
        target,
        timestamp: Date.now(),
      } as T;

      this.port.postMessage(message);
      this.logger.debug('Message sent', { target, type: message.type });
    } catch (error) {
      this.handleMessageError(error);
      throw error;
    }
  }

  /**
   * Disconnect from the current connection
   */
  disconnect(): void {
    this.disconnectExisting();
  }

  private disconnectExisting(): void {
    if (this.port) {
      try {
        this.port.disconnect();
      } catch (error) {
        this.logger.warn('Error during disconnection:', error);
      }
      this.port = null;
      this.status = 'disconnected';
    }
  }

  private handleDisconnection(error: chrome.runtime.LastError | undefined): void {
    const wasConnected = this.status === 'connected';
    this.port = null;
    this.status = 'disconnected';

    if (this.isExtensionContextInvalidated(error)) {
      this.logger.warn('Extension context invalidated');
      return;
    }

    if (wasConnected && this.shouldAttemptReconnection()) {
      this.reconnectWithBackoff();
    }
  }

  private async reconnectWithBackoff(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    const baseDelay = 100;
    const maxDelay = 5000;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempts), maxDelay);

    this.reconnectAttempts++;
    this.logger.debug('Attempting reconnection', {
      attempt: this.reconnectAttempts,
      delay,
    });

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      this.connect();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  private handleConnectionError(error: unknown): void {
    this.status = 'disconnected';
    this.logger.error('Connection error:', error);
  }

  private handleMessageError(error: unknown): void {
    this.logger.error('Message sending failed:', error);

    if (this.isConnectionError(error)) {
      this.handleDisconnection(undefined);
    }
  }

  private shouldAttemptReconnection(): boolean {
    return this.context !== 'background' && this.reconnectAttempts < this.maxReconnectAttempts;
  }

  private isConnectionError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('Could not establish connection');
  }

  private isExtensionContextInvalidated(error: unknown): boolean {
    return (
      error &&
      'message' in (error as any) &&
      (error as any).message.includes('Extension context invalidated')
    );
  }

  private setupConnectionHandlers(): void {
    if (!this.port) return;

    // Disconnectのハンドリング
    this.port.onDisconnect.addListener(() => {
      const error = chrome.runtime.lastError;
      this.handleDisconnection(error);
    });

    // メッセージ受信のハンドリング
    this.port.onMessage.addListener((message: BaseMessage) => {
      this.handleMessage(message);
    });
  }

  private handleMessage(message: BaseMessage): void {
    // メッセージの宛先チェック
    if (message.target !== this.context) {
      return;
    }

    this.logger.debug('Message received', {
      from: message.source,
      type: message.type,
    });

    // 登録されたハンドラでメッセージを処理
    if (this.messageHandler) {
      try {
        this.messageHandler(message);
      } catch (error) {
        this.logger.error('Error in message handler:', error);
      }
    }
  }
}

// usage example
export const createConnectionManager = (context: Context): ConnectionManager => {
  return new ConnectionManager(context);
};
