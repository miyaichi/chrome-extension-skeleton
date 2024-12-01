import { BaseMessage } from './types';

export interface TabInfo {
  tabId: number;
  windowId: number;
  url: string;
}

// Type definition of message payload
export interface MessagePayloads {
  GET_TAB_ID: undefined;
  GET_TAB_ID_RESPONSE: { tabId: number };
}

// Type-safe message type definition
export type Message<T extends keyof MessagePayloads> = BaseMessage & {
  type: T;
  payload: MessagePayloads[T];
};

// Union of all message types
export type ExtensionMessage = {
  [K in keyof MessagePayloads]: Message<K>;
}[keyof MessagePayloads];
