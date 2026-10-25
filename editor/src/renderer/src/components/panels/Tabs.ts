export enum TabType {
  Browser = "browser",
}

export interface BrowserTab {
  id: string;
  type: TabType.Browser;
  name: string;
  isLoading: boolean;
  error: string;
  /** The url the webview is currently on, which may differ from `data.url` after navigation. */
  currentUrl?: string;
  data: {
    url: string;
  };
}

export type Tab = BrowserTab;
