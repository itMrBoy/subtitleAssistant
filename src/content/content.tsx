import '@ant-design/v5-patch-for-react-19';
import 'antd/dist/reset.css';
import { showMessage } from '../utils';

chrome.runtime.onMessage.addListener((request: unknown, _sender: unknown, sendResponse: (response?: unknown) => void) => { 
  
  if (request && typeof request === 'object' && 'type' in request) { 
    const { type, data, msg } = request as { type: string, data: string, msg: string };
    if (type === "subtitle_downloading") {
      console.log("data: ", data);
      console.log("msg: ", msg);
      
      // 在页面上显示通知
      showMessage(data, msg);
    }
  }

  sendResponse();
  return true;
}); 