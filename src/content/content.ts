
// 防止在插件页面运行
(function() {
  if (window.location.protocol === 'chrome-extension:') {
    console.log("在插件页面，跳过content script执行");
    return;
  }
})();

chrome.runtime.onMessage.addListener((request: unknown, _sender: unknown, sendResponse: (response?: unknown) => void) => { 
  console.log("Content Script 收到消息:", request);
  
  if (request && typeof request === 'object' && 'message' in request && request.message === "Hello") { 
    console.log("hello from content script");
  }

  sendResponse();
  return true;
});
