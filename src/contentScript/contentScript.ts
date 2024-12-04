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

// Initialize content script
if (!window.contentScriptInitialized) {
  window.contentScriptInitialized = true;
  new ContentScript();
}
