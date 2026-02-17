// Set side panel to open on extension icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// === Credits background polling ===
chrome.alarms.create('credits-check', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'credits-check') return;
  await checkCreditsOnActiveTab();
});

async function checkCreditsOnActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && tab.url &&
        (tab.url.includes('lovable.dev') || tab.url.includes('lovable.app'))) {
      await checkCreditsOnTab(tab.id);
    }
  } catch (e) { /* ignore */ }
}

async function checkCreditsOnTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'GET_CREDITS' });
    chrome.runtime.sendMessage({
      type: 'CREDITS_UPDATE',
      data: response
    }).catch(() => {});
  } catch (e) { /* content script not loaded */ }
}

// Listen for tab changes and notify the side panel
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url?.includes('lovable.dev') || tab.url?.includes('lovable.app')) {
      chrome.runtime.sendMessage({ type: 'TAB_CHANGED', tabId: activeInfo.tabId }).catch(() => {});
    }
  } catch (e) {
    // Tab might not be accessible, ignore
  }
});

// Also listen for URL changes and tab load completion
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && (changeInfo.url.includes('lovable.dev') || changeInfo.url.includes('lovable.app'))) {
    chrome.runtime.sendMessage({ type: 'TAB_CHANGED', tabId }).catch(() => {});
  }

  // When a Lovable tab finishes loading, trigger a credits check
  if (changeInfo.status === 'complete' && tab.url &&
      (tab.url.includes('lovable.dev') || tab.url.includes('lovable.app'))) {
    await checkCreditsOnTab(tabId);
  }
});
