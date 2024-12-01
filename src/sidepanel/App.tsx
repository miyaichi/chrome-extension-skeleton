import React, { useEffect, useState } from 'react';
import { TabInfo } from '../types/messages';
import { BaseMessage } from '../types/types';
import { ConnectionManager } from '../utils/connectionManager';
import { Logger } from '../utils/logger';

const logger = new Logger('sidepanel');

export default function App() {
  const [activeTabInfo, setactiveTabInfo] = useState<TabInfo | null>(null);
  const [connectionManager, setConnectionManager] = useState<ConnectionManager | null>(null);
  const initialized = React.useRef(false);

  useEffect(() => {
    if (initialized.current) {
      logger.debug('App already initialized, skipping...');
      return;
    }

    const initializeTab = async () => {
      if (initialized.current) {
        return;
      }

      try {
        const manager = new ConnectionManager('sidepanel', handleMessage);
        manager.connect();
        setConnectionManager(manager);

        // Initialize active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          setactiveTabInfo({ tabId: tab.id, windowId: tab.windowId, url: tab.url || '' });
          initialized.current = true;
        }

        logger.debug('Initalized', { tab });
      } catch (error) {
        logger.error('Tab initialization failed:', error);
      }
    };

    initializeTab();

    // Monitor active tab change
    const handleTabChange = async (activeInfo: chrome.tabs.TabActiveInfo) => {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (!tab.url) return;

      setactiveTabInfo({ tabId: activeInfo.tabId, windowId: activeInfo.windowId, url: tab.url });
    };
    chrome.tabs.onActivated.addListener(handleTabChange);

    // Monitor tab URL change
    const handleTabUpdated = async (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (changeInfo.status === 'complete') {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab.id === tabId) {
          setactiveTabInfo({ tabId, windowId: tab.windowId, url: tab.url || '' });
        }
      }
    };
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    // Monitor window focus change
    const handleWindowFocus = async (windowId: number) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) return;

      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (!tab?.url) return;

      setactiveTabInfo({ tabId: tab.id!, windowId, url: tab.url });
    };
    chrome.windows.onFocusChanged.addListener(handleWindowFocus);

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabChange);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.windows.onFocusChanged.removeListener(handleWindowFocus);
      connectionManager?.disconnect();
    };
  }, []);

  const handleMessage = (message: BaseMessage) => {
    logger.debug('Message received', { type: message.type });
    // Implement other message handling here ...
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h1 className="text-xl font-bold mb-4">Side Panel</h1>
        {activeTabInfo ? (
          <div>
            <p>Active Tab ID: {activeTabInfo.tabId}</p>
            <p>Window ID: {activeTabInfo.windowId}</p>
            <p>URL: {activeTabInfo.url}</p>
          </div>
        ) : (
          <p>No active tab</p>
        )}
      </div>
    </div>
  );
}
