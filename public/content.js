// Heartbeat Content Script
// Handles communication between the extension and the Lovable page

const DEBUG_CREDITS = false;
const DEBUG_INJECT = false;

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
  // Primary selector - Lovable's chat input with aria-label
  let chatInput = document.querySelector('[aria-label="Chat input"][contenteditable="true"]');
  
  // Fallback selectors in order of preference
  if (!chatInput) {
    chatInput = document.querySelector('div[contenteditable="true"].ProseMirror');
  }
  if (!chatInput) {
    chatInput = document.querySelector('.tiptap[contenteditable="true"]');
  }
  if (!chatInput) {
    chatInput = document.querySelector('textarea[placeholder*="Ask"]');
  }
  if (!chatInput) {
    chatInput = document.querySelector('textarea[placeholder*="Message"]');
  }
  if (!chatInput) {
    // Last resort - any contenteditable
    chatInput = document.querySelector('[contenteditable="true"]');
  }

  if (!chatInput) {
    if (DEBUG_INJECT) {
      console.error('[Heartbeat Debug] Could not find chat input. Selector results:', {
        ariaLabel: document.querySelectorAll('[aria-label="Chat input"]').length,
        proseMirror: document.querySelectorAll('.ProseMirror[contenteditable]').length,
        tiptap: document.querySelectorAll('.tiptap[contenteditable]').length,
        anyContentEditable: document.querySelectorAll('[contenteditable="true"]').length
      });
    }
    sendResponse({ success: false, error: 'Chat input element not found on page' });
    return;
  }

  try {
    // Scroll into view and focus
    chatInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
    chatInput.focus();

    // For contenteditable elements (Lovable uses ProseMirror/Tiptap)
    if (chatInput.getAttribute('contenteditable') === 'true') {
      // Clear existing content first
      chatInput.innerHTML = '';
      
      // Use execCommand for best compatibility with contenteditable
      const success = document.execCommand('insertText', false, text);
      
      // Fallback: set innerHTML directly if execCommand fails
      if (!success || chatInput.textContent.trim() === '') {
        chatInput.innerHTML = '<p>' + text + '</p>';
      }
      
      // Dispatch events so React/ProseMirror detects the change
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      chatInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Standard textarea/input
      chatInput.value = text;
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Move cursor to end
      if (chatInput.setSelectionRange) {
        chatInput.setSelectionRange(text.length, text.length);
      }
    }

    if (DEBUG_INJECT) {
      console.log('[Heartbeat] Successfully injected prompt into:', chatInput.tagName);
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('[Heartbeat] Injection error:', error);
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
      sendResponse({ freeCreditsAvailable: false, timestamp: Date.now() });
      return;
    }

    // Navigate up to find the containing panel
    let creditsContainer = creditsPanelLabel.parentElement;
    // Go up a few levels to get the full credits section
    for (let i = 0; i < 5 && creditsContainer; i++) {
      if (creditsContainer.textContent?.includes('Daily credits')) break;
      creditsContainer = creditsContainer.parentElement;
    }

    if (!creditsContainer) {
      if (DEBUG_CREDITS) console.log('[Heartbeat] Credits container not found');
      sendResponse({ freeCreditsAvailable: false, timestamp: Date.now() });
      return;
    }

    if (DEBUG_CREDITS) console.log('[Heartbeat] Found credits container:', creditsContainer.textContent?.substring(0, 100));

    // Check for free daily credits availability
    const containerText = creditsContainer.textContent || '';
    const freeCreditsAvailable = containerText.includes('Daily credits used first');
    
    if (DEBUG_CREDITS) console.log('[Heartbeat] Free credits available:', freeCreditsAvailable);

    sendResponse({
      freeCreditsAvailable,
      timestamp: Date.now()
    });
  } catch (error) {
    if (DEBUG_CREDITS) console.error('[Heartbeat] Credits scraping error:', error);
    sendResponse({ error: error.message });
  }
}
