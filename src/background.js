
const API_KEY = 'AIzaSyDJuseopw7-gMY5QSSm4DZZVPv1I6X9b4E';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    summarizeContent(request.content, request.title, request.type)
      .then(summary => {
        sendResponse({ summary });
      })
      .catch(error => {
        console.error('Summarization error:', error);
        sendResponse({ error: error.message });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

async function summarizeContent(content, title, type) {
  // Prepare the prompt based on the summary type
  let prompt;
  const maxContentLength = 8000; // Limit content length to avoid API issues
  const truncatedContent = content.length > maxContentLength 
    ? content.substring(0, maxContentLength) + '...' 
    : content;
  
  switch (type) {
    case 'brief':
      prompt = `Summarize the following content from "${title}" in 2-3 concise sentences:\n\n${truncatedContent}`;
      break;
    case 'detailed':
      prompt = `Provide a comprehensive summary of the following content from "${title}" in about 3-5 paragraphs, covering the key points and main arguments:\n\n${truncatedContent}`;
      break;
    case 'bullet':
      prompt = `Summarize the following content from "${title}" as 5-7 bullet points, highlighting the most important information:\n\n${truncatedContent}`;
      break;
    default:
      prompt = `Summarize the following content from "${title}" concisely:\n\n${truncatedContent}`;
  }
  
  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorData}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('API request error:', error);
    throw new Error('Failed to summarize content. Please try again later.');
  }
}
