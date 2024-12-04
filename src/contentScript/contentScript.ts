import { MessageHandler } from '../types/messages';
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
    try {
      // Listen for PING messages
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'PING') return true;
        if (message.type === 'SIDEPANEL_CLOSED') {
          this.performCleanup();
          return true;
        }
      });

      // Get activeTabInfo from storage
      const { activeTabInfo } = await chrome.storage.local.get('activeTabInfo');

      if (activeTabInfo?.isScriptInjectionAllowed) {
        this.setupConnection(activeTabInfo.tabId);
      } else {
        this.logger.debug('Script injection not allowed for this tab');
      }

      // Listen for storage changes
      chrome.storage.local.onChanged.addListener((changes) => {
        const { oldValue, newValue } = changes.activeTabInfo || {};
        const newTabId = newValue?.tabId;
        const isAllowed = newValue?.isScriptInjectionAllowed;

        // Setup connection if allowed and connection doesn't exist or tabId has changed
        if (newTabId && isAllowed && (!this.connectionManager || newTabId !== oldValue?.tabId)) {
          this.setupConnection(newTabId);
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize content script:', error);
    }
  }

  private setupConnection(tabId: number) {
    if (this.connectionManager) {
      this.logger.debug('Connection already established');
      return;
    }

    try {
      this.logger.debug('Setting up connection', { tabId });
      this.connectionManager = new ConnectionManager(`content-${tabId}`, this.handleMessage);
      this.connectionManager.connect();
      this.logger.debug('Connection established', { tabId });
    } catch (error) {
      this.logger.error('Failed to setup connection:', error);
    }
  }

  private handleMessage: MessageHandler = (message) => {
    this.logger.debug('Message received', { type: message.type });

    // Implement other message handling here ...
    switch (message.type) {
      default:
        this.logger.debug('Unknown message type:', message.type);
        break;
    }
  };

  // Cleanup on sidepanel close
  private performCleanup() {
    this.logger.info('Sidepanel closed, performing cleanup');
    // Implement cleanup logic here ...
  }
}

// Initialize content script
if (!window.contentScriptInitialized) {
  window.contentScriptInitialized = true;
  new ContentScript();
}
