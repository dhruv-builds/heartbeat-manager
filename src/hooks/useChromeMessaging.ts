import { useCallback, useEffect, useState, useRef } from 'react';

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
      addListener: (callback: (message: { type: string; tabId?: number }, sender: unknown, sendResponse: (response?: unknown) => void) => boolean | void) => void;
      removeListener: (callback: (message: { type: string; tabId?: number }, sender: unknown, sendResponse: (response?: unknown) => void) => boolean | void) => void;
    };
  };
  tabs?: {
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<Array<{ id?: number; url?: string }>>;
    sendMessage: (tabId: number, message: { type: string; text?: string }) => Promise<{ 
      success?: boolean; 
      isLovable?: boolean; 
      projectName?: string | null; 
      url?: string; 
      error?: string;
      content?: string | null;
    }>;
    update: (tabId: number, updateProperties: { url?: string }) => Promise<unknown>;
    onActivated?: {
      addListener: (callback: (activeInfo: { tabId: number; windowId: number }) => void) => void;
      removeListener: (callback: (activeInfo: { tabId: number; windowId: number }) => void) => void;
    };
    onUpdated?: {
      addListener: (callback: (tabId: number, changeInfo: { url?: string }, tab: { active?: boolean }) => void) => void;
      removeListener: (callback: (tabId: number, changeInfo: { url?: string }, tab: { active?: boolean }) => void) => void;
    };
  };
  scripting?: {
    executeScript: (options: {
      target: { tabId: number };
      func: () => string;
    }) => Promise<Array<{ result: string }>>;
  };
};

// Check if we're running as a Chrome extension
function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
}

// Parse Lovable project UUID from URL (corrected regex)
function parseLovableProjectId(url: string): string | null {
  const match = url.match(/^https:\/\/lovable\.dev\/projects\/([0-9a-fA-F-]{36})(?:[/?#].*)?$/);
  return match ? match[1] : null;
}

// Check if URL is restricted (non-HTTP/HTTPS)
function isRestrictedUrl(url: string | null): boolean {
  if (!url) return true;
  return !url.startsWith('http://') && !url.startsWith('https://');
}

export function useChromeMessaging() {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [isExtension] = useState(isChromeExtension);
  const [activeTabUrl, setActiveTabUrl] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Listen for tab change messages from background script
  useEffect(() => {
    if (!isExtension || !chrome.runtime?.onMessage) return;

    const handleMessage = (message: { type: string; tabId?: number }) => {
      if (message.type === 'TAB_CHANGED') {
        // Re-check current page when tab changes
        checkCurrentPage();
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    
    return () => {
      chrome.runtime.onMessage?.removeListener(handleMessage);
    };
  }, [isExtension, checkCurrentPage]);

  useEffect(() => {
    checkCurrentPage();
  }, [checkCurrentPage]);

  const scrapePageContent = useCallback(async (): Promise<string | null> => {
    if (!isExtension) {
      // Dev mode: return mock content
      return "Development mode - This is mock page content. In the actual extension, this would contain the full text from the current Lovable project page.";
    }

    try {
      const [tab] = await chrome.tabs!.query({ active: true, currentWindow: true });
      if (!tab?.id) return "";

      const results = await chrome.scripting!.executeScript({
        target: { tabId: tab.id },
        func: () => document.body.innerText,
      });

      // Return the .result property from the first frame
      return results?.[0]?.result || "";
    } catch (error) {
      console.error("Scraping failed:", error);
      return "";
    }
  }, [isExtension]);

  const copyImageToClipboard = useCallback(async (imageSource: string): Promise<boolean> => {
    try {
      let blob: Blob;
      
      if (imageSource.startsWith('data:')) {
        // Handle base64
        const matches = imageSource.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches) {
          console.error('Invalid base64 image format');
          return false;
        }
        
        const mimeType = matches[1];
        const base64Data = matches[2];
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        // Handle URL - fetch the image
        const response = await fetch(imageSource);
        blob = await response.blob();
      }
      
      // Write to clipboard using ClipboardItem
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      
      return true;
    } catch (error) {
      console.error('Failed to copy image to clipboard:', error);
      return false;
    }
  }, []);

  // Get active tab URL directly
  const getActiveTabUrl = useCallback(async (): Promise<string | null> => {
    if (!isExtension) return null;
    try {
      const tabs = await chrome.tabs!.query({ active: true, currentWindow: true });
      return tabs[0]?.url || null;
    } catch {
      return null;
    }
  }, [isExtension]);

  // Navigate active tab to a URL
  const navigateActiveTab = useCallback(async (url: string): Promise<boolean> => {
    if (!isExtension) return false;
    try {
      const tabs = await chrome.tabs!.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id) return false;
      
      // Check for restricted URLs
      if (isRestrictedUrl(tab.url || null)) {
        return false;
      }
      
      await chrome.tabs!.update(tab.id, { url });
      return true;
    } catch {
      return false;
    }
  }, [isExtension]);

  // Tab URL tracking with debounce and cleanup
  useEffect(() => {
    if (!isExtension) return;

    const updateActiveTabUrl = async () => {
      const url = await getActiveTabUrl();
      setActiveTabUrl(url);
    };

    const debouncedUpdate = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(updateActiveTabUrl, 200);
    };

    // Initial fetch
    updateActiveTabUrl();

    // Listen for tab activation changes
    const handleTabActivated = () => debouncedUpdate();
    
    // Listen for URL updates within tabs
    const handleTabUpdated = (
      _tabId: number, 
      changeInfo: { url?: string }, 
      tab: { active?: boolean }
    ) => {
      if (changeInfo.url && tab.active) {
        debouncedUpdate();
      }
    };

    chrome.tabs?.onActivated?.addListener(handleTabActivated);
    chrome.tabs?.onUpdated?.addListener(handleTabUpdated);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      chrome.tabs?.onActivated?.removeListener(handleTabActivated);
      chrome.tabs?.onUpdated?.removeListener(handleTabUpdated);
    };
  }, [isExtension, getActiveTabUrl]);

  // Derived state
  const detectedLovableId = activeTabUrl ? parseLovableProjectId(activeTabUrl) : null;
  const isOnLovableHost = activeTabUrl?.startsWith('https://lovable.dev/') || false;
  const isRestrictedTab = isRestrictedUrl(activeTabUrl);

  return {
    isExtension,
    pageInfo,
    checkCurrentPage,
    injectPrompt,
    scrapePageContent,
    copyImageToClipboard,
    activeTabUrl,
    detectedLovableId,
    isOnLovableHost,
    isRestrictedTab,
    navigateActiveTab,
  };
}
