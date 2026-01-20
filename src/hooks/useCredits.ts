import { useState, useCallback, useEffect } from 'react';

declare const chrome: {
  runtime?: {
    id?: string;
    onMessage?: {
      addListener: (callback: (message: { type: string }, sender: unknown, sendResponse: (response?: unknown) => void) => void) => void;
      removeListener: (callback: (message: { type: string }, sender: unknown, sendResponse: (response?: unknown) => void) => void) => void;
    };
  };
  tabs?: {
    query: (
      queryInfo: { active: boolean; currentWindow: boolean },
      callback: (tabs: Array<{ id?: number }>) => void
    ) => void;
    sendMessage: (
      tabId: number,
      message: { type: string },
      callback: (response: CreditsResponse) => void
    ) => void;
  };
};

interface CreditsResponse {
  freeCreditsAvailable?: boolean | null;
  status?: string;
  timestamp?: number;
  error?: string;
}

export interface CreditsData {
  freeCreditsAvailable: boolean | null; // true = available, false = none, null = unknown
  lastUpdated: Date | null;
}

function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}

export function useCredits() {
  const [credits, setCredits] = useState<CreditsData>({
    freeCreditsAvailable: null,
    lastUpdated: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!isChromeExtension()) {
      // In development/non-extension mode, return mock data
      setCredits({
        freeCreditsAvailable: true,
        lastUpdated: new Date(),
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab?.id) {
          setError('No active tab found');
          setIsLoading(false);
          return;
        }

        chrome.tabs?.sendMessage(
          activeTab.id,
          { type: 'GET_CREDITS' },
          (response: CreditsResponse) => {
            setIsLoading(false);

            if (chrome.runtime && (chrome.runtime as unknown as { lastError?: { message: string } }).lastError) {
              setError('Could not connect to page');
              return;
            }

            if (!response) {
              setError('No response from page');
              return;
            }

            if (response.error) {
              if (response.error === 'not_lovable') {
                setError('Not on Lovable');
              } else {
                setError(response.error);
              }
              return;
            }

            setCredits({
              freeCreditsAvailable: response.freeCreditsAvailable ?? null,
              lastUpdated: new Date(),
            });
          }
        );
      });
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Listen for CREDITS_CONSUMED messages from content script
  useEffect(() => {
    if (!isChromeExtension()) return;

    const handleMessage = (message: { type: string }) => {
      if (message.type === 'CREDITS_CONSUMED') {
        setCredits({
          freeCreditsAvailable: false,
          lastUpdated: new Date(),
        });
      }
    };

    chrome.runtime?.onMessage?.addListener(handleMessage);
    return () => {
      chrome.runtime?.onMessage?.removeListener(handleMessage);
    };
  }, []);

  // Fetch on mount and auto-refresh every 60 seconds
  useEffect(() => {
    fetchCredits();
    const interval = setInterval(fetchCredits, 60000);
    return () => clearInterval(interval);
  }, [fetchCredits]);

  return { credits, isLoading, error, fetchCredits };
}

export function formatRelativeTime(date: Date | null): string {
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1m ago';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1h ago';
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleTimeString();
}
