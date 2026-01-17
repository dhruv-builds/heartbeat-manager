import { useCallback, useEffect, useState } from 'react';

interface PageInfo {
  isLovable: boolean;
  projectName: string | null;
  url: string;
}

// Declare chrome as a global for TypeScript
declare const chrome: {
  runtime?: {
    id?: string;
    onMessage?: {
      addListener: (callback: (message: unknown, sender: unknown, sendResponse: (response?: unknown) => void) => boolean | void) => void;
    };
  };
  tabs?: {
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<Array<{ id?: number }>>;
    sendMessage: (tabId: number, message: { type: string; text?: string }) => Promise<{ success?: boolean; isLovable?: boolean; projectName?: string | null; url?: string; error?: string }>;
  };
};

// Check if we're running as a Chrome extension
function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
}

export function useChromeMessaging() {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [isExtension] = useState(isChromeExtension);

  const checkCurrentPage = useCallback(async (): Promise<PageInfo | null> => {
    if (!isExtension) {
      // Mock response for development in browser
      return {
        isLovable: false,
        projectName: null,
        url: window.location.href,
      };
    }

    try {
      const tabs = await chrome.tabs!.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id) return null;

      const response = await chrome.tabs!.sendMessage(tab.id, { type: 'CHECK_CURRENT_PAGE' });
      const info: PageInfo = {
        isLovable: response.isLovable || false,
        projectName: response.projectName || null,
        url: response.url || '',
      };
      setPageInfo(info);
      return info;
    } catch (e) {
      console.error('Failed to check current page:', e);
      return null;
    }
  }, [isExtension]);

  const injectPrompt = useCallback(async (text: string): Promise<boolean> => {
    if (!isExtension) {
      // In dev mode, just copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        console.log('Dev mode - would inject:', text);
        return true;
      }
    }

    try {
      const tabs = await chrome.tabs!.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id) return false;

      const response = await chrome.tabs!.sendMessage(tab.id, { 
        type: 'INJECT_PROMPT', 
        text 
      });
      return response?.success || false;
    } catch (e) {
      console.error('Failed to inject prompt:', e);
      return false;
    }
  }, [isExtension]);

  useEffect(() => {
    checkCurrentPage();
  }, [checkCurrentPage]);

  return {
    isExtension,
    pageInfo,
    checkCurrentPage,
    injectPrompt,
  };
}
