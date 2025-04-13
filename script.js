// Main JavaScript for Photo-Based Question Answering Application

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const imageUploadContainer = document.getElementById('image-upload-container');
  const fileInput = document.getElementById('file-input');
  const imagePreview = document.getElementById('image-preview');
  const submitBtn = document.getElementById('submit-btn');
  const responseContent = document.getElementById('response-content');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  
  // Fixed prompt for all requests
  const fixedPrompt = `# 角色
你是一个专业的拍题解答者，能够准确地对图片中的作业题进行解答，并给出详细的解题思路和答案。

## 技能：问题解答
1. 当用户提供包含作业题的图片时，请解答图片中的所有题目。
2. 为用户详细分析解题思路，一步一步地进行讲解。解答过程尽量简洁，例如选择题要求选择错误的一项时，仅需要输出该项错误理由，不需要逐个选项进行分析
3. 针对每道题，以简洁的形式给出解答过程和最终答案，并确保答案的准确性，请参考图中题目的目录结构依次按照以下格式进行输出。不要输出其他文字或内容。以下格式为参考格式，请以原题的序号和顺序为准
   -  **题目1-1**： <图片中题目的内容>
   -  **答案**： <明确的答案内容>
   -  **解题思路**： <详细的解题步骤和思路说明>
4. 返回 LaTeX 时在\`$公式内容$\`前，应该留一个空格。如"**答案** $\\frac{47}{40}$"
5. 针对完型填空题，或者类似填空题，题目输出部分请保留下划线。解答中，进行必要的加粗。如"he worked as farm labour on fields that __21__ (lie) on the other side of the hill."


## 限制:
- 只解答图片中的作业题，拒绝回答与作业题无关的问题。
- 输出要简洁直接,推理过程请尽量简短，不要无限循环，如果多次错误请先忽略这个问题
- 所输出的内容必须按照给定的格式进行组织，不能偏离框架要求。
- 确保解题思路清晰、答案准确。`;
  
  let uploadedImage = null;
  let imageBase64 = null;
  
  // Event Listeners
  imageUploadContainer.addEventListener('click', () => fileInput.click());
  
  // Drag and drop functionality
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    imageUploadContainer.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    imageUploadContainer.addEventListener(eventName, () => {
      imageUploadContainer.classList.add('drag-over');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    imageUploadContainer.addEventListener(eventName, () => {
      imageUploadContainer.classList.remove('drag-over');
    }, false);
  });
  
  imageUploadContainer.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
      handleFiles(files);
    }
  }
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFiles(e.target.files);
    }
  });
  
  submitBtn.addEventListener('click', handleSubmit);
  
  // Functions
  function handleFiles(files) {
    uploadedImage = files[0];
    
    if (!uploadedImage.type.match('image.*')) {
      showError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = 'block';
      imageBase64 = e.target.result.split(',')[1]; // Remove the data:image/jpeg;base64, part
      
      // Enable submit button if both image and question are provided
      checkSubmitButton();
    };
    reader.readAsDataURL(uploadedImage);
  }
  
  // Check if submit button should be enabled
  function checkSubmitButton() {
    submitBtn.disabled = !imageBase64;
  }
  
  async function handleSubmit() {
    if (!imageBase64) {
      showError('请上传一张图片');
      return;
    }
    
    // Clear previous response and errors
    responseContent.textContent = '';
    errorMessage.style.display = 'none';
    
    // Show loading indicator
    loadingIndicator.style.display = 'flex';
    submitBtn.disabled = true;
    
    try {
      await sendRequest();
    } catch (error) {
      console.error('Error:', error);
      showError('An error occurred while processing your request. Please try again.');
    } finally {
      loadingIndicator.style.display = 'none';
      submitBtn.disabled = false;
    }
  }
  
  async function sendRequest() {
    // Check if API key is available
    if (!window.appConfig || !window.appConfig.DASHSCOPE_API_KEY || 
        window.appConfig.DASHSCOPE_API_KEY === 'your_api_key_here') {
      showError('API key not set. Please update the .config file with your DashScope API key.');
      return;
    }
    
    const apiKey = window.appConfig.DASHSCOPE_API_KEY;
    
    const requestData = {
      model: "qvq-max",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            },
            {
              type: "text",
              text: "请解答这道题"
            }
          ]
        },
        {
          role: "assistant",
          content: "我会解答这道题。"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: fixedPrompt
            }
          ]
        }
      ],
      stream: true,
      stream_options: { include_usage: true },
      parameters: {
        result_format: "message" // 确保返回完整的推理过程
      }
    };
    
    // Use fetch with streaming response
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }
    
    // Handle streaming response with direct DOM updates and improved debugging
    try {
      console.log('Starting to process stream...');
      
      // Hide loading indicator and prepare response area
      loadingIndicator.style.display = 'none';
      responseContent.innerHTML = '';
      
      // Set up a text decoder
      const decoder = new TextDecoder();
      
      // Get a reader from the response body
      const reader = response.body.getReader();
      
      // Create variables to store the accumulated content
      let fullContent = '';
      let fullReasoningContent = '';
      let buffer = '';
      let hasReceivedAnyContent = false;
      
      // Add a debug element to show raw content (hidden in production)
      const debugElement = document.createElement('div');
      debugElement.style.display = 'none';
      debugElement.style.whiteSpace = 'pre-wrap';
      debugElement.style.fontSize = '12px';
      debugElement.style.color = '#666';
      debugElement.style.marginTop = '20px';
      debugElement.style.padding = '10px';
      debugElement.style.border = '1px solid #ddd';
      debugElement.style.borderRadius = '4px';
      debugElement.style.backgroundColor = '#f9f9f9';
      debugElement.textContent = '--- Debug: Raw Stream Data ---\n';
      document.body.appendChild(debugElement);
      
      // Process the stream
      while (true) {
        // Read a chunk from the stream
        const { done, value } = await reader.read();
        
        // If we're done, break out of the loop
        if (done) {
          console.log('Stream complete');
          break;
        }
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Log raw chunk for debugging
        console.log('Raw chunk:', chunk);
        debugElement.textContent += chunk + '\n';
        
        // Process complete lines in the buffer
        let lineEnd;
        while ((lineEnd = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            // Skip [DONE] message
            if (data === '[DONE]') continue;
            
            try {
              // Parse the JSON data
              const parsedData = JSON.parse(data);
              
              // Log the parsed data for debugging
              console.log('Parsed data:', parsedData);
              
              // Extract both content and reasoning_content
              let content = '';
              let reasoningContent = '';
              
              // Check for content in various formats
              if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                content = parsedData.choices[0].delta.content || '';
              } else if (parsedData.choices && parsedData.choices[0]?.message?.content) {
                content = parsedData.choices[0].message.content || '';
              }
              
              // Check for reasoning_content
              if (parsedData.choices && parsedData.choices[0]?.delta?.reasoning_content) {
                reasoningContent = parsedData.choices[0].delta.reasoning_content || '';
              }
              
              // Log what we found
              if (content) console.log('Content received:', content);
              if (reasoningContent) console.log('Reasoning content received:', reasoningContent);
              
              // Process content if we have either type
              if (content || reasoningContent) {
                // Mark that we've received some content
                hasReceivedAnyContent = true;
                // Create separate sections for reasoning and final answer
                if (!responseContent.querySelector('.reasoning-section')) {
                  // Create sections if they don't exist
                  const reasoningSection = document.createElement('div');
                  reasoningSection.className = 'reasoning-section';
                  reasoningSection.style.backgroundColor = '#f5f5f5';
                  reasoningSection.style.padding = '10px';
                  reasoningSection.style.marginBottom = '15px';
                  reasoningSection.style.borderRadius = '4px';
                  reasoningSection.style.border = '1px solid #e0e0e0';
                  
                  const reasoningTitle = document.createElement('div');
                  reasoningTitle.style.fontWeight = 'bold';
                  reasoningTitle.style.marginBottom = '5px';
                  reasoningTitle.textContent = '思考过程：';
                  reasoningSection.appendChild(reasoningTitle);
                  
                  const reasoningContent = document.createElement('div');
                  reasoningContent.className = 'reasoning-content';
                  reasoningSection.appendChild(reasoningContent);
                  
                  const answerSection = document.createElement('div');
                  answerSection.className = 'answer-section';
                  
                  const answerTitle = document.createElement('div');
                  answerTitle.style.fontWeight = 'bold';
                  answerTitle.style.marginBottom = '5px';
                  answerTitle.textContent = '最终答案：';
                  answerSection.appendChild(answerTitle);
                  
                  const answerContent = document.createElement('div');
                  answerContent.className = 'answer-content';
                  answerSection.appendChild(answerContent);
                  
                  // Clear and add the new sections
                  responseContent.innerHTML = '';
                  responseContent.appendChild(reasoningSection);
                  responseContent.appendChild(answerSection);
                }
                
                // Get the sections
                const reasoningContentEl = responseContent.querySelector('.reasoning-content');
                const answerContentEl = responseContent.querySelector('.answer-content');
                
                // Update the appropriate section
                if (reasoningContent) {
                  // Add to reasoning content
                  fullReasoningContent += reasoningContent;
                  const formattedReasoning = reasoningContent
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                  
                  reasoningContentEl.innerHTML += formattedReasoning;
                }
                
                if (content) {
                  // Add to answer content
                  const formattedContent = content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>');
                  
                  answerContentEl.innerHTML += formattedContent;
                }
                
                // Scroll to bottom if needed
                if (responseContent.scrollHeight > responseContent.clientHeight) {
                  responseContent.scrollTop = responseContent.scrollHeight;
                }
                
                // Force a small delay to ensure UI updates
                await new Promise(resolve => setTimeout(resolve, 1));
              }
            } catch (e) {
              console.error('Error parsing JSON:', e, 'in line:', line);
            }
          }
        }
      }
      
      // Process any remaining data in the buffer
      if (buffer.trim()) {
        console.log('Processing remaining buffer:', buffer);
        const lines = buffer.split('\n');
        
        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
            try {
              const parsedData = JSON.parse(line.slice(6).trim());
              if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
                const content = parsedData.choices[0].delta.content;
                fullContent += content;
                
                // Update display one last time
                responseContent.innerHTML = fullContent
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br>');
              }
            } catch (e) {
              console.error('Error parsing JSON in remaining buffer:', e);
            }
          }
        }
      }
      
      // Debug output to help diagnose the issue
      console.log('Content tracking status:', {
        hasReceivedAnyContent,
        fullContentLength: fullContent.length,
        fullReasoningContentLength: fullReasoningContent.length,
        responseContentHTML: responseContent.innerHTML
      });
      
      // Check if we have any visible content in the response area
      const hasVisibleContent = responseContent.textContent.trim().length > 0;
      console.log('Has visible content:', hasVisibleContent);
      
      // Only show error if we truly have no content
      if (!hasVisibleContent && !hasReceivedAnyContent && !fullContent && !fullReasoningContent) {
        showError('未收到任何回答内容，请重试');
      } else {
        // Make sure error is hidden if we have content
        errorMessage.style.display = 'none';
      }
    } catch (error) {
      console.error('Error handling stream:', error);
      showError('处理响应流时出错，请重试');
    }
  }
  
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
});
