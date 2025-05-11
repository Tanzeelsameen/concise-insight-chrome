
// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    summarizeContent(request.content, request.title, request.type)
      .then(summary => {
        sendResponse({ summary });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});

// Function to call the AI API for summarization
async function summarizeContent(content, title, type) {
  try {
    console.log(`Summarizing content (${type}): ${title}`);
    
    // Prepare the prompt based on summary type
    let prompt = '';
    switch(type) {
      case 'brief':
        prompt = `Summarize this content in 2-3 concise sentences: "${content}"`;
        break;
      case 'detailed':
        prompt = `Provide a detailed summary of this content in about 5-7 sentences, covering the main points: "${content}"`;
        break;
      case 'bullet':
        prompt = `Summarize this content in 5-7 bullet points, highlighting the key information: "${content}"`;
        break;
      default:
        prompt = `Summarize this content briefly: "${content}"`;
    }
    
    // Limit content length to avoid API limits
    const limitedContent = content.substring(0, 10000);
    
    // API key provided by the user
    const apiKey = 'AIzaSyDJuseopw7-gMY5QSSm4DZZVPv1I6X9b4E';
    
    // Call Google's Generative AI API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt.replace('${content}', limitedContent)
          }]
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract summary from the response
    if (data.candidates && data.candidates[0] && data.candidates[0].content && 
        data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Failed to extract summary from API response');
    }
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
}
