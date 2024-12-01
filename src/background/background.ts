// src/background/background.ts
import { TabInfo } from '../types/messages';
import { Context, MessageHandler } from '../types/types';
import { ConnectionManager } from '../utils/connectionManager';
import { Logger } from '../utils/logger';

class BackgroundService {
  private connectionManager: ConnectionManager;
  private logger: Logger;
  private activeTabInfo: TabInfo | null = null;

  constructor() {
    this.logger = new Logger('background');
    this.connectionManager = new ConnectionManager('background', this.handleMessage);
    this.connectionManager.connect();
    this.setupChromeListeners();
  }

  private handleMessage: MessageHandler = (message) => {
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

  private setupChromeListeners() {
    // Monitor tab activation
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (!tab.url) return;

      this.activeTabInfo = {
        tabId: activeInfo.tabId,
        windowId: activeInfo.windowId,
        url: tab.url,
      };

      await this.notifySidePanel();
    });

    // Monitor window focus
    chrome.windows.onFocusChanged.addListener(async (windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) return;

      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (!tab?.url) return;

      this.activeTabInfo = {
        tabId: tab.id!,
        windowId,
        url: tab.url,
      };

      await this.notifySidePanel();
    });
  }

  private async notifySidePanel() {
    if (!this.activeTabInfo) return;

    await this.connectionManager.sendMessage('sidepanel', {
      type: 'TAB_ACTIVATED',
      payload: this.activeTabInfo,
    });
  }
}

// Initialize the background service
new BackgroundService();
