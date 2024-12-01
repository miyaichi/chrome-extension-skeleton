import { MessageHandler, TabInfo } from '../types/messages';
import { Context } from '../types/types';
import { ConnectionManager } from '../utils/connectionManager';
import { Logger } from '../utils/logger';

class BackgroundService {
  private connectionManager: ConnectionManager;
  private logger: Logger;
  private activeTabInfo: TabInfo | null = null;

  constructor() {
    this.logger = new Logger('background');
    this.connectionManager = new ConnectionManager('background', this.handleMessage);
    this.setupConnection();
    this.setupChromeListeners();
  }

  private async setupConnection() {
    try {
      this.connectionManager.connect();

      setInterval(() => {
        if (this.connectionManager.getStatus() !== 'connected') {
          this.logger.debug('Reconnecting background service...');
          this.connectionManager.connect();
        }
      }, 5000);
    } catch (error) {
      this.logger.error('Failed to setup connection:', error);
    }
  }

  private setupChromeListeners() {
    // Monitor tab activation
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (!tab?.url) {
          this.logger.debug('No URL found for activated tab');
          return;
        }

        this.activeTabInfo = {
          tabId: activeInfo.tabId,
          windowId: activeInfo.windowId,
          url: tab.url,
        };
        this.logger.debug('Tab activated', this.activeTabInfo);
      } catch (error) {
        this.logger.error('Failed to handle tab activation:', error);
      }
    });

    // Monitor tab URL change
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      try {
        if (changeInfo.status === 'complete') {
          if (!tab.windowId) {
            this.logger.warn('No window ID found for updated tab');
            return;
          }

          this.activeTabInfo = {
            tabId,
            windowId: tab.windowId,
            url: tab.url || '',
          };
          this.logger.debug('Tab updated', this.activeTabInfo);
        }
      } catch (error) {
        this.logger.error('Failed to handle tab update:', error);
      }
    });

    // Monitor window focus
    chrome.windows.onFocusChanged.addListener(async (windowId) => {
      try {
        if (windowId === chrome.windows.WINDOW_ID_NONE) return;

        const [tab] = await chrome.tabs.query({ active: true, windowId });
        if (!tab?.url) {
          this.logger.debug('No active tab or URL found');
          return;
        }
        if (!tab.id) {
          this.logger.warn('Tab found but no tab ID available');
          return;
        }

        this.activeTabInfo = { tabId: tab.id, windowId, url: tab.url };
        this.logger.debug('Active tab updated', this.activeTabInfo);
      } catch (error) {
        this.logger.error('Failed to handle window focus change:', error);
      }
    });

    // Monitor sidepanel close
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'sidepanel') {
        port.onDisconnect.addListener(async () => {
          try {
            this.logger.debug('Side panel disconnected');
            const tabs = await chrome.tabs.query({});
            for (const tab of tabs) {
              if (tab.id) {
                try {
                  // Directly use chrome.tabs.sendMessage instead of ConnectionManager
                  await chrome.tabs.sendMessage(tab.id, {
                    type: 'SIDEPANEL_CLOSED',
                    payload: undefined,
                  });
                } catch (error) {
                  this.logger.debug(`Failed to send message to tab ${tab.id}:`, error);
                }
              }
            }
          } catch (error) {
            this.logger.error('Failed to notify content scripts:', error);
          }
        });
      }
    });

    // Get sender tab ID for content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'GET_TAB_ID' && sender.tab?.id) {
        sendResponse({ tabId: sender.tab.id });
      }
    });
  }

  private handleMessage: MessageHandler = (message) => {
    // Implement other message handling here ..
    this.logger.debug('Message received', { type: message.type });
    switch (message.type) {
      case 'GET_TAB_ID':
        this.handleGetTabId(message.source);
        break;
    }
  };

  private async handleGetTabId(source: Context) {
    if (!source.startsWith('content-')) return;

    const tabId = parseInt(source.split('-')[1]);
    await this.connectionManager.sendMessage(source, {
      type: 'GET_TAB_ID_RESPONSE',
      payload: { tabId },
    });
  }
}

// Initialize the background service
new BackgroundService();
