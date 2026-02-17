// LavaLog Content Script
// Handles communication between the extension and the Lovable page

const DEBUG_CREDITS = false;
const DEBUG_INJECT = false;
const CREDITS_STORAGE_KEY = 'lavalog_credits_status';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_CURRENT_PAGE') {
    handleCheckCurrentPage(sendResponse);
    return true;
  }
  
  if (message.type === 'INJECT_PROMPT') {
    handleInjectPrompt(message.text, sendResponse);
    return true;
  }

  if (message.type === 'GET_CREDITS') {
    handleGetCredits(sendResponse);
    return true;
  }

  if (message.type === 'SCRAPE_PAGE_CONTENT') {
    handleScrapePageContent(sendResponse);
    return true;
  }
});

function handleScrapePageContent(sendResponse) {
  try {
    const content = document.body.innerText || '';
    sendResponse({
      success: true,
      content: content.slice(0, 50000)
    });
  } catch (error) {
    console.error('[LavaLog] Scrape error:', error);
    sendResponse({ 
      success: false, 
      error: error.message,
      content: null 
    });
  }
}

function handleCheckCurrentPage(sendResponse) {
  const hostname = window.location.hostname;
  const isLovable = hostname.includes('lovable.dev') || hostname.includes('lovable.app');
  
  let projectName = null;
  
  if (isLovable) {
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
    chatInput = document.querySelector('[contenteditable="true"]');
  }

  if (!chatInput) {
    if (DEBUG_INJECT) {
      console.error('[LavaLog Debug] Could not find chat input. Selector results:', {
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
    chatInput.scrollIntoView({ block: 'center', behavior: 'smooth' });
    chatInput.focus();

    if (chatInput.getAttribute('contenteditable') === 'true') {
      chatInput.innerHTML = '';
      const success = document.execCommand('insertText', false, text);
      if (!success || chatInput.textContent.trim() === '') {
        chatInput.innerHTML = '<p>' + text + '</p>';
      }
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      chatInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      chatInput.value = text;
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
      if (chatInput.setSelectionRange) {
        chatInput.setSelectionRange(text.length, text.length);
      }
    }

    if (DEBUG_INJECT) {
      console.log('[LavaLog] Successfully injected prompt into:', chatInput.tagName);
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('[LavaLog] Injection error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function handleGetCredits(sendResponse) {
  const hostname = window.location.hostname;
  
  if (!hostname.includes('lovable.dev') && !hostname.includes('lovable.app')) {
    if (DEBUG_CREDITS) console.log('[LavaLog] Not on Lovable, skipping credits fetch');
    sendResponse({ error: 'not_lovable' });
    return;
  }

  const today = new Date().toDateString();

  try {
    if (DEBUG_CREDITS) console.log('[LavaLog] Starting credits scrape...');

    const allParagraphs = Array.from(document.querySelectorAll('p'));
    const creditsPanelLabel = allParagraphs.find(p => p.textContent?.trim() === 'Credits');
    
    if (creditsPanelLabel) {
      let creditsContainer = creditsPanelLabel.parentElement;
      for (let i = 0; i < 5 && creditsContainer; i++) {
        if (creditsContainer.textContent?.includes('Daily credits')) break;
        creditsContainer = creditsContainer.parentElement;
      }

      const containerText = creditsContainer?.textContent || '';
      const hasNegativeIndicator = containerText.includes('0/5') || containerText.includes('0 left') || containerText.includes('No credits');
      const hasPositiveIndicator = containerText.includes('Daily credits used first');

      if (DEBUG_CREDITS) console.log('[LavaLog] Container text:', containerText.substring(0, 200));

      let status = 'unknown';
      if (hasPositiveIndicator && !hasNegativeIndicator) {
        status = 'available';
      } else if (hasNegativeIndicator) {
        status = 'none';
      }

      if (status !== 'unknown') {
        localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify({ status, date: today }));
      }

      if (DEBUG_CREDITS) console.log('[LavaLog] Credits status:', status);

      sendResponse({
        freeCreditsAvailable: status === 'available' ? true : status === 'none' ? false : null,
        status,
        timestamp: Date.now()
      });
    } else {
      if (DEBUG_CREDITS) console.log('[LavaLog] Credits panel not found, checking cache...');
      
      try {
        const cached = JSON.parse(localStorage.getItem(CREDITS_STORAGE_KEY) || '{}');
        if (cached.date === today && cached.status && cached.status !== 'unknown') {
          if (DEBUG_CREDITS) console.log('[LavaLog] Using cached status:', cached.status);
          sendResponse({
            freeCreditsAvailable: cached.status === 'available',
            status: cached.status,
            timestamp: Date.now()
          });
          return;
        }
      } catch (e) {
        // Ignore cache errors
      }

      sendResponse({
        freeCreditsAvailable: null,
        status: 'unknown',
        timestamp: Date.now()
      });
    }
  } catch (error) {
    if (DEBUG_CREDITS) console.error('[LavaLog] Credits scraping error:', error);
    sendResponse({ error: error.message });
  }
}

// Credits invalidation - detect when user submits a prompt
function setupCreditsInvalidation() {
  const hostname = window.location.hostname;
  if (!hostname.includes('lovable.dev') && !hostname.includes('lovable.app')) return;

  const today = new Date().toDateString();

  function invalidateAndRecheck() {
    // Set to unknown (neutral/gray) instead of none (red)
    localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify({ 
      status: 'unknown', 
      date: today 
    }));
    // Notify extension of invalidation
    try {
      chrome.runtime.sendMessage({ type: 'CREDITS_INVALIDATED' });
    } catch (e) {
      // Extension context might not be available
    }
    // Schedule a re-check after 3 seconds
    setTimeout(() => {
      handleGetCredits((result) => {
        try {
          chrome.runtime.sendMessage({
            type: 'CREDITS_UPDATE',
            data: result
          });
        } catch (e) {
          // ignore
        }
      });
    }, 3000);
  }

  // Listen for Enter key in chat input (submitting a prompt)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const chatInput = document.querySelector('[aria-label="Chat input"][contenteditable="true"]');
      if (chatInput && document.activeElement === chatInput && chatInput.textContent?.trim()) {
        invalidateAndRecheck();
      }
    }
  });

  // Listen for Send button clicks
  document.addEventListener('click', (e) => {
    const target = e.target;
    const sendButton = target.closest && target.closest('button[type="submit"], button[aria-label*="Send"], button[aria-label*="send"]');
    if (sendButton) {
      invalidateAndRecheck();
    }
  }, true);

  if (DEBUG_CREDITS) console.log('[LavaLog] Credits invalidation listeners set up');
}

// Initialize on page load
setupCreditsInvalidation();
