// src/types/messages.ts
import { BaseMessage, Context } from './types';

export interface TabInfo {
  tabId: number;
  windowId: number;
  url: string;
}

// メッセージペイロードの型定義
export interface MessagePayloads {
  GET_TAB_ID: undefined;
  GET_TAB_ID_RESPONSE: { tabId: number };
  TAB_ACTIVATED: TabInfo;
  WINDOW_FOCUSED: { windowId: number };
}

// 型安全なメッセージ型の定義
export type Message<T extends keyof MessagePayloads> = BaseMessage & {
  type: T;
  payload: MessagePayloads[T];
};

// 全メッセージの共用型
export type ExtensionMessage = {
  [K in keyof MessagePayloads]: Message<K>;
}[keyof MessagePayloads];
