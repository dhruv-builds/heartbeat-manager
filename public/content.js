// Heartbeat Content Script
// Handles communication between the extension and the Lovable page

const DEBUG_CREDITS = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_CURRENT_PAGE') {
    handleCheckCurrentPage(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'INJECT_PROMPT') {
    handleInjectPrompt(message.text, sendResponse);
    return true;
  }

  if (message.type === 'GET_CREDITS') {
    handleGetCredits(sendResponse);
    return true;
  }
});

function handleCheckCurrentPage(sendResponse) {
  const hostname = window.location.hostname;
  const isLovable = hostname.includes('lovable.dev') || hostname.includes('lovable.app');
  
  let projectName = null;
  
  if (isLovable) {
    // Try to find the project name in the Lovable UI
    const projectNameElement = document.querySelector('p[translate="no"]');
    if (projectNameElement) {
      projectName = projectNameElement.textContent?.trim() || null;
    }
  }
  
  sendResponse({
    isLovable,
    projectName,
    url: window.location.href
  });
}

function handleInjectPrompt(text, sendResponse) {
  // Find the chat textarea in Lovable
  const textarea = document.querySelector('textarea[placeholder*="Message"]') 
    || document.querySelector('textarea')
    || document.querySelector('[contenteditable="true"]');
  
  if (!textarea) {
    sendResponse({ success: false, error: 'Could not find chat input' });
    return;
  }
  
  try {
    // Handle both textarea and contenteditable elements
    if (textarea.tagName === 'TEXTAREA' || textarea.tagName === 'INPUT') {
      textarea.value = text;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // For contenteditable
      textarea.textContent = text;
      textarea.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
    }
    
    // Focus the textarea so user can immediately press Enter
    textarea.focus();
    
    // Move cursor to end
    if (textarea.setSelectionRange) {
      textarea.setSelectionRange(text.length, text.length);
    }
    
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

function handleGetCredits(sendResponse) {
  const hostname = window.location.hostname;
  
  if (!hostname.includes('lovable.dev') && !hostname.includes('lovable.app')) {
    if (DEBUG_CREDITS) console.log('[Heartbeat] Not on Lovable, skipping credits fetch');
    sendResponse({ error: 'not_lovable' });
    return;
  }

  try {
    if (DEBUG_CREDITS) console.log('[Heartbeat] Starting credits scrape...');

    // Find Credits panel by locating a <p> with exact text "Credits"
    const allParagraphs = Array.from(document.querySelectorAll('p'));
    const creditsPanelLabel = allParagraphs.find(p => p.textContent?.trim() === 'Credits');
    
    if (!creditsPanelLabel) {
      if (DEBUG_CREDITS) console.log('[Heartbeat] Credits panel label not found');
      sendResponse({ error: 'credits_panel_not_found' });
      return;
    }

    // Navigate up to find the containing panel
    let creditsContainer = creditsPanelLabel.parentElement;
    // Go up a few levels to get the full credits section
    for (let i = 0; i < 5 && creditsContainer; i++) {
      if (creditsContainer.textContent?.includes('left')) break;
      creditsContainer = creditsContainer.parentElement;
    }

    if (!creditsContainer) {
      if (DEBUG_CREDITS) console.log('[Heartbeat] Credits container not found');
      sendResponse({ error: 'credits_container_not_found' });
      return;
    }

    if (DEBUG_CREDITS) console.log('[Heartbeat] Found credits container:', creditsContainer.textContent?.substring(0, 100));

    // Find total credits (e.g., "44.9 left")
    const containerParagraphs = Array.from(creditsContainer.querySelectorAll('p'));
    const creditsTextEl = containerParagraphs.find(p => /\d+(\.\d+)?\s+left$/.test(p.textContent?.trim() || ''));
    
    let totalCreditsRemaining = null;
    if (creditsTextEl) {
      const match = creditsTextEl.textContent?.match(/(\d+(\.\d+)?)\s+left/);
      if (match) {
        totalCreditsRemaining = parseFloat(match[1]);
        if (DEBUG_CREDITS) console.log('[Heartbeat] Parsed total credits:', totalCreditsRemaining);
      }
    } else {
      if (DEBUG_CREDITS) console.log('[Heartbeat] Credits text element not found');
    }

    // Check for daily credits availability
    const containerText = creditsContainer.textContent || '';
    const dailyCreditsAvailable = containerText.includes('Daily credits used first');
    
    if (DEBUG_CREDITS) console.log('[Heartbeat] Daily credits available:', dailyCreditsAvailable);

    sendResponse({
      totalCreditsRemaining,
      dailyCreditsAvailable,
      timestamp: Date.now()
    });
  } catch (error) {
    if (DEBUG_CREDITS) console.error('[Heartbeat] Credits scraping error:', error);
    sendResponse({ error: error.message });
  }
}
