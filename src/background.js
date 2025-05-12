
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
    console.log(`Content length: ${content.length} characters`);
    
    // Limit content length to avoid API limits
    const limitedContent = content.substring(0, 8000);
    
    // Prepare the prompt based on summary type
    let prompt = '';
    switch(type) {
      case 'brief':
        prompt = `Summarize this content in 2-3 concise sentences: ${limitedContent}`;
        break;
      case 'detailed':
        prompt = `Provide a detailed summary of this content in about 5-7 sentences, covering the main points: ${limitedContent}`;
        break;
      case 'bullet':
        prompt = `Summarize this content in 5-7 bullet points, highlighting the key information: ${limitedContent}`;
        break;
      default:
        prompt = `Summarize this content briefly: ${limitedContent}`;
    }
    
    // API key provided by the user
    const apiKey = 'AIzaSyDJuseopw7-gMY5QSSm4DZZVPv1I6X9b4E';

    console.log("Preparing to send request to Gemini API");
    
    // Updated to use the correct model name "gemini-pro" instead of "gemini-1.0-pro"
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });
    
    console.log("API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error response:", errorText);
      throw new Error(`API request failed with status: ${response.status}. Details: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("API response data:", JSON.stringify(data).substring(0, 200) + "...");
    
    // Extract summary from the response based on the correct Gemini API structure
    if (data.candidates && data.candidates[0] && data.candidates[0].content && 
        data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected API response structure:", JSON.stringify(data));
      throw new Error('Failed to extract summary from API response');
    }
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
}
