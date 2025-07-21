import '@ant-design/v5-patch-for-react-19';
import 'antd/dist/reset.css';
import { showMessage } from '../utils/content';
import { extractSubtitles } from '../utils/subtitleExtractor';

// 监听来自DevTools的消息
window.addEventListener('message', (event) => {
  if (event.data.type === 'SUBTITLE_REQUEST_DETECTED') {
    console.log('检测到字幕请求:', event.data.data);
    showMessage('info', '检测到字幕请求');
  }
});

chrome.runtime.onMessage.addListener((request: unknown, _sender: unknown, sendResponse: (response?: unknown) => void) => { 
  if (request && typeof request === 'object' && 'type' in request) { 
    const { type, data, msg, videoId } = request as { type: string, data?: string, msg?: string, videoId?: string };
    
    if (type === "subtitle_downloading") {
      console.log("data: ", data);
      console.log("msg: ", msg);
      
      // 在页面上显示通知
      showMessage(data || 'info', msg || '');
    } else if (type === "extract_subtitles") {
      // 处理字幕提取请求
      console.log("收到字幕提取请求，视频ID:", videoId);
      
      // 异步提取字幕
      extractSubtitles().then(subtitleText => {
        if (subtitleText) {
          console.log("字幕提取成功，字符数:", subtitleText.length);
          sendResponse({ success: true, subtitleText });
        } else {
          console.log("字幕提取失败");
          sendResponse({ success: false, error: "无法提取字幕" });
        }
      }).catch(error => {
        console.error("字幕提取错误:", error);
        sendResponse({ success: false, error: error.message });
      });
      
      // 返回true表示异步响应
      return true;
    }
  }

  sendResponse();
  return true;
}); 