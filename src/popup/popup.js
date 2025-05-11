
document.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const briefBtn = document.getElementById('brief');
  const detailedBtn = document.getElementById('detailed');
  const bulletBtn = document.getElementById('bullet');
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('result');
  const summaryContent = document.getElementById('summary-content');
  const copyBtn = document.getElementById('copy-btn');
  
  // Function to highlight the active button
  function setActiveButton(activeBtn) {
    [briefBtn, detailedBtn, bulletBtn].forEach(btn => {
      btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
  }
  
  // Function to show loading state
  function showLoading() {
    loadingEl.style.display = 'flex';
    resultEl.style.display = 'none';
  }
  
  // Function to show result
  function showResult(summary) {
    loadingEl.style.display = 'none';
    resultEl.style.display = 'block';
    summaryContent.textContent = summary;
  }
  
  // Function to get the current tab's content and request a summary
  async function getSummary(type) {
    try {
      showLoading();
      
      // Get the current active tab
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      const activeTab = tabs[0];
      
      // Execute script to get page content
      const result = await chrome.scripting.executeScript({
        target: {tabId: activeTab.id},
        function: getPageContent
      });
      
      const pageContent = result[0].result;
      const pageTitle = activeTab.title;
      
      // Send message to background script to get summary
      chrome.runtime.sendMessage({
        action: 'summarize',
        content: pageContent,
        title: pageTitle,
        type: type
      }, response => {
        if (response.error) {
          showResult(`Error: ${response.error}`);
        } else {
          showResult(response.summary);
        }
      });
      
    } catch (error) {
      showResult(`Error: ${error.message}`);
    }
  }
  
  // Function to get page content (executed in the context of the webpage)
  function getPageContent() {
    // Get main content by trying different methods
    const article = document.querySelector('article') || 
                   document.querySelector('.article') || 
                   document.querySelector('.post') ||
                   document.querySelector('main') ||
                   document.body;
    
    // Remove unwanted elements
    const elementsToRemove = article.querySelectorAll('aside, nav, footer, .ads, .comments, script, style');
    elementsToRemove.forEach(el => el.remove());
    
    // Get the cleaned text content
    return article.innerText.trim();
  }
  
  // Add event listeners to buttons
  briefBtn.addEventListener('click', function() {
    setActiveButton(briefBtn);
    getSummary('brief');
  });
  
  detailedBtn.addEventListener('click', function() {
    setActiveButton(detailedBtn);
    getSummary('detailed');
  });
  
  bulletBtn.addEventListener('click', function() {
    setActiveButton(bulletBtn);
    getSummary('bullet');
  });
  
  // Copy button functionality
  copyBtn.addEventListener('click', function() {
    navigator.clipboard.writeText(summaryContent.textContent).then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<span class="copy-icon">✓</span><span>Copied!</span>';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    });
  });
  
  // Auto-trigger brief summary when popup opens
  // Uncomment the line below if you want this behavior
  // briefBtn.click();
});
