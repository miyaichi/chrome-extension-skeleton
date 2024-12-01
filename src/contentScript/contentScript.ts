import { MessageHandler } from '../types/types';
import { ConnectionManager } from '../utils/connectionManager';
import { Logger } from '../utils/logger';

class ContentScript {
  private connectionManager: ConnectionManager | null = null;
  private logger: Logger;

  constructor(sender: chrome.runtime.MessageSender) {
    this.logger = new Logger('content-script');
    this.setupPermanentConnection(sender.tab?.id || 0);
  }

  private async setupPermanentConnection(tabId: number) {
    if (this.connectionManager) return;

    // Create a permanent connection with the correct TabID
    this.logger.debug('Setting up permanent connection', { tabId });
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

// ContentScript initialization
const contentScriptInstances = new WeakMap<Window, ContentScript>();

// Ensure content script is initialized immediately
if (!contentScriptInstances.has(window)) {
  const logger = new Logger('content-script');

  logger.log('Initializing content script...');
  // Get the tab ID from the background
  chrome.runtime.sendMessage({ type: 'GET_TAB_ID' }, (response) => {
    if (chrome.runtime.lastError) {
      logger.error('Failed to get tab ID:', chrome.runtime.lastError);
      return;
    }

    const sender = {
      tab: { id: response.tabId },
    } as chrome.runtime.MessageSender;

    contentScriptInstances.set(window, new ContentScript(sender));
  });
}
