import { MessageHandler } from '../types/messages';
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
    try {
      if (this.connectionManager) return;

      this.logger.debug('Setting up permanent connection', { tabId });
      this.connectionManager = new ConnectionManager(
        `content-${tabId}`,
        this.handlePermanentMessages
      );
      this.connectionManager.connect();
      this.logger.debug('Permanent connection established', { tabId });
    } catch (error) {
      this.logger.error('Failed to setup permanent connection:', error);
    }
  }

  private handlePermanentMessages: MessageHandler = (message) => {
    this.logger.debug('Message received', { type: message.type });

    switch (message.type) {
      case 'SIDEPANEL_CLOSED':
        this.logger.debug('Sidepanel closed, performing cleanup');
        this.performCleanup();
        break;
      // Implement other message handling here ...
    }
  };

  private performCleanup() {
    this.logger.debug('Starting cleanup');
    // Implement cleanup logic here ...
  }
}

// ContentScript initialization
const contentScriptInstances = new WeakMap<Window, ContentScript>();

// Ensure content script is initialized immediately
if (!contentScriptInstances.has(window)) {
  const logger = new Logger('content-script');

  try {
    logger.log('Initializing content script...');
    // Get the tab ID from the background
    chrome.runtime.sendMessage({ type: 'GET_TAB_ID' }, (response) => {
      if (chrome.runtime.lastError) {
        logger.error('Failed to get tab ID:', chrome.runtime.lastError);
        return;
      }

      if (!response?.tabId) {
        logger.error('No tab ID received in response');
        return;
      }

      const sender = {
        tab: { id: response.tabId },
      } as chrome.runtime.MessageSender;

      contentScriptInstances.set(window, new ContentScript(sender));
    });
  } catch (error) {
    logger.error('Failed to initialize content script:', error);
  }
}
