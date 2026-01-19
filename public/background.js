// Set side panel to open on extension icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for tab changes and notify the side panel
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url?.includes('lovable.dev') || tab.url?.includes('lovable.app')) {
      // Send message to side panel to refresh project detection
      chrome.runtime.sendMessage({ type: 'TAB_CHANGED', tabId: activeInfo.tabId }).catch(() => {
        // Side panel might not be open, ignore error
      });
    }
  } catch (e) {
    // Tab might not be accessible, ignore
  }
});

// Also listen for URL changes within the same tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && (changeInfo.url.includes('lovable.dev') || changeInfo.url.includes('lovable.app'))) {
    chrome.runtime.sendMessage({ type: 'TAB_CHANGED', tabId }).catch(() => {
      // Side panel might not be open, ignore error
    });
  }
});
