// DevTools 面板脚本
const requestLog = document.getElementById('requestLog');

// 监听来自devtools.ts的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SUBTITLE_REQUEST_DETECTED') {
    addRequestToLog(message.data);
  }
});

interface RequestData {
  url: string;
  method: string;
  status: number;
  mimeType: string;
}

function addRequestToLog(requestData: RequestData) {
  if (!requestLog) return;
  
  // 清除"等待请求"消息
  if (requestLog.textContent?.includes('等待字幕请求')) {
    requestLog.innerHTML = '';
  }
  
  const requestItem = document.createElement('div');
  requestItem.className = 'request-item';
  requestItem.innerHTML = `
    <div><strong>时间:</strong> ${new Date().toLocaleTimeString()}</div>
    <div><strong>状态:</strong> ${requestData.status}</div>
    <div><strong>类型:</strong> ${requestData.mimeType}</div>
    <div><strong>URL:</strong></div>
    <div class="request-url">${requestData.url}</div>
  `;
  
  // 添加到顶部
  requestLog.insertBefore(requestItem, requestLog.firstChild);
  
  // 限制显示的请求数量
  const items = requestLog.querySelectorAll('.request-item');
  if (items.length > 10) {
    items[items.length - 1].remove();
  }
}

console.log('字幕助手面板已加载'); 