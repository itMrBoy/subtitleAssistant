// DevTools 脚本 - 这里可以使用 chrome.devtools API
console.log('DevTools 扩展已加载');

// 网络请求拦截功能
function setupNetworkInterception() {
  if (!chrome.devtools || !chrome.devtools.network) {
    console.error('chrome.devtools.network 不可用');
    return;
  }

  console.log('设置网络拦截...');
  
  chrome.devtools.network.onRequestFinished.addListener((request) => {
    // 检查是否是字幕相关的请求
    const url = request.request.url;
    
    // 匹配YouTube字幕API请求
    if (url.includes('timedtext') || url.includes('caption') || url.includes('subtitle')) {
      console.log('检测到字幕请求:', {
        url: url,
        method: request.request.method,
        status: request.response.status,
        mimeType: request.response.content.mimeType
      });
      
      // 发送消息到content script
      chrome.devtools.inspectedWindow.eval(`
        (function() {
          // 向content script发送消息
          window.postMessage({
            type: 'SUBTITLE_REQUEST_DETECTED',
            data: {
              url: '${url}',
              method: '${request.request.method}',
              status: ${request.response.status},
              mimeType: '${request.response.content.mimeType}'
            }
          }, '*');
        })();
      `);
    }
  });
}

// 当DevTools面板准备好时设置拦截
if (chrome.devtools.network) {
  setupNetworkInterception();
} else {
  console.error('chrome.devtools.network API 不可用');
}

// 可选：创建一个DevTools面板
chrome.devtools.panels.create(
  'YouTube字幕助手',
  'icons/icon-16.png',
  'src/devtools/panel.html',
  () => {
    console.log('字幕助手面板已创建');
  }
); 