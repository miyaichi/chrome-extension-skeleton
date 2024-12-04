import React, { useEffect, useState } from 'react';
import { BaseMessage, MessagePayloads } from '../types/messages';
import { Context } from '../types/types';
import { ConnectionManager } from '../utils/connectionManager';
import { Logger } from '../utils/logger';

const logger = new Logger('sidepanel');

// Only for display purpose
interface DisplayInfo {
  url: string;
  windowId: number;
}

export default function App() {
  const [tabId, setTabId] = useState<number | null>(null);
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo | null>(null);
  const [connectionManager, setConnectionManager] = useState<ConnectionManager | null>(null);
  const [contentScriptContext, setContentScriptContext] = useState<Context>('undefined');
  const initialized = React.useRef(false);

  useEffect(() => {
    if (initialized.current) {
      logger.debug('App already initialized, skipping...');
      return;
    }

    const initializeTab = async () => {
      if (initialized.current) return;

      try {
        const manager = new ConnectionManager('sidepanel', handleMessage);
        manager.connect();
        setConnectionManager(manager);

        // Initialize active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          setTabId(tab.id);
          setDisplayInfo({
            windowId: tab.windowId,
            url: tab.url || '',
          });
          initialized.current = true;
        }

        logger.debug('Initialized', { tab });
      } catch (error) {
        logger.error('Tab initialization failed:', error);
      }
    };

    initializeTab();

    // Monitor active tab change
    const handleTabChange = async (activeInfo: chrome.tabs.TabActiveInfo) => {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (!tab.url) return;

      setTabId(activeInfo.tabId);
      setDisplayInfo({
        windowId: activeInfo.windowId,
        url: tab.url,
      });
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
          setTabId(tabId);
          setDisplayInfo({
            windowId: tab.windowId,
            url: tab.url || '',
          });
        }
      }
    };
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    // Monitor window focus change
    const handleWindowFocus = async (windowId: number) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) return;

      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (!tab?.url) return;

      setTabId(tab.id!);
      setDisplayInfo({
        windowId,
        url: tab.url,
      });
    };
    chrome.windows.onFocusChanged.addListener(handleWindowFocus);

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabChange);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.windows.onFocusChanged.removeListener(handleWindowFocus);
      connectionManager?.disconnect();
    };
  }, []);

  useEffect(() => {
    // Update content script context
    setContentScriptContext(tabId ? `content-${tabId}` : 'undefined');
  }, [tabId, displayInfo]);

  const handleMessage = (message: BaseMessage) => {
    logger.debug('Message received', { type: message.type });

    // Implement other message handling here ...
    switch (message.type) {
      case 'TEST_MESSAGE_FOR_SIDEPANEL':
        const payload = message.payload as MessagePayloads['TEST_MESSAGE_FOR_SIDEPANEL'];
        logger.debug('Received message:', payload.message);
        break;
      default:
        logger.debug('Unknown message type:', message.type);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h1 className="text-xl font-bold mb-4">Side Panel</h1>
        {tabId && displayInfo ? (
          <div>
            <p>Active Tab ID: {tabId}</p>
            <p>Window ID: {displayInfo.windowId}</p>
            <p>URL: {displayInfo.url}</p>
          </div>
        ) : (
          <p>No active tab</p>
        )}
      </div>
    </div>
  );
}
