// Heartbeat Content Script
// Handles communication between the extension and the Lovable page

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_CURRENT_PAGE') {
    handleCheckCurrentPage(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'INJECT_PROMPT') {
    handleInjectPrompt(message.text, sendResponse);
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
