import React, { useEffect, useState } from 'react';
import { TabInfo } from '../types/messages';
import { BaseMessage } from '../types/types';
import { ConnectionManager } from '../utils/connectionManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabInfo | null>(null);
  const [connectionManager, setConnectionManager] = useState<ConnectionManager | null>(null);

  useEffect(() => {
    const manager = new ConnectionManager('sidepanel', handleMessage);
    manager.connect();
    setConnectionManager(manager);

    return () => {
      manager.disconnect();
    };
  }, []);

  const handleMessage = (message: BaseMessage) => {
    switch (message.type) {
      case 'TAB_ACTIVATED':
        setActiveTab(message.payload as TabInfo);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h1 className="text-xl font-bold mb-4">Side Panel</h1>
        {activeTab ? (
          <div>
            <p>Active Tab ID: {activeTab.tabId}</p>
            <p>Window ID: {activeTab.windowId}</p>
            <p>URL: {activeTab.url}</p>
          </div>
        ) : (
          <p>No active tab</p>
        )}
      </div>
    </div>
  );
}
