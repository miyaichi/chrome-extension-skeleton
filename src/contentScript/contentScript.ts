// src/contentScript/contentScript.ts
import { MessageHandler } from '../types/types';
import { ConnectionManager } from '../utils/connectionManager';
import { Logger } from '../utils/logger';

class ContentScript {
  private connectionManager: ConnectionManager | null = null;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('content-script');
    this.initialize();
  }

  private async initialize() {
    // Temporarily create a connection to get the TabID
    const tempManager = new ConnectionManager('content-0', this.handleMessage);
    tempManager.connect();

    await tempManager.sendMessage('background', {
      type: 'GET_TAB_ID',
      payload: undefined,
    });
  }

  private handleMessage: MessageHandler = async (message) => {
    switch (message.type) {
      case 'GET_TAB_ID_RESPONSE':
        const payload = message.payload as { tabId: number };
        await this.setupPermanentConnection(payload.tabId);
        break;
    }
  };

  private async setupPermanentConnection(tabId: number) {
    if (this.connectionManager) return;

    // Create a permanent connection with the correct TabID
    this.connectionManager = new ConnectionManager(
      `content-${tabId}`,
      this.handlePermanentMessages
    );
    this.connectionManager.connect();
    this.logger.debug('Permanent connection established', { tabId });
  }

  private handlePermanentMessages: MessageHandler = (message) => {
    // Implement other message handling here ...
    this.logger.debug('Message received', { type: message.type });
  };
}

// Initialize the Content Script
new ContentScript();
