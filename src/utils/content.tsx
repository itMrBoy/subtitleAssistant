import '@ant-design/v5-patch-for-react-19';
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { App, ConfigProvider, message } from 'antd';
import type { MessageInstance, NoticeType } from 'antd/es/message/interface';
import zhCN from 'antd/locale/zh_CN';

// 注入自定义样式
export function injectCustomStyles() {    
    // 添加自定义样式确保消息组件正确显示
    const style = document.createElement('style');
    style.textContent = `
      .ant-message {
        z-index: 999999 !important;
      }
      .ant-message-notice {
        z-index: 999999 !important;
      }
      #subtitle-assistant-message-container .ant-app {
        color: inherit;
      }
      #subtitle-assistant-message-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }
    `;
    document.head.appendChild(style);
    
    return true;
}

// 初始化消息容器
let messageContainer: HTMLDivElement | null = null;
let root: Root | null = null;
let isStylesInjected = false;
let messageApiInstance: MessageInstance | null = null;

export function initMessageContainer(): Promise<MessageInstance> {
  return new Promise((resolve) => {
    // 等待 messageApi 初始化完成
    const checkMessageApi = (messageApiInstance: MessageInstance) => {
      if (messageApiInstance) {
        resolve(messageApiInstance);
      } else {
        setTimeout(() => checkMessageApi(messageApiInstance), 50);
      }
    };
    if (!messageContainer) {
      // 注入自定义样式
      if (!isStylesInjected) {
        isStylesInjected = injectCustomStyles();
      }
      
      messageContainer = document.createElement('div');
      messageContainer.id = 'subtitle-assistant-message-container';
      messageContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        pointer-events: none;
      `;
      document.body.appendChild(messageContainer);
      
      // 创建React根节点
      root = createRoot(messageContainer);
      
      // 内部组件，用于获取 messageApi
      const MessageProvider: React.FC = () => {
        const [messageApi, contextHolder] = message.useMessage();
        
        // 将 messageApi 暴露到全局
        React.useEffect(() => {
          messageApiInstance = messageApi;
        }, [messageApi]);

        return <>{contextHolder}</>;
      };
      
      // 渲染App包装器with ConfigProvider and MessageProvider
      root.render(
        React.createElement(ConfigProvider, {
          locale: zhCN,
          theme: {
            token: {
              zIndexPopupBase: 999999,
            },
          },
        }, React.createElement(App, {
          style: { pointerEvents: 'auto' }
        }, React.createElement(MessageProvider)))
      );
    }
    checkMessageApi(messageApiInstance as MessageInstance);
  });
}

// 消息类型映射
const getValidMessageType = (type: string): NoticeType => {
  const validTypes: Record<string, NoticeType> = {
    'success': 'success',
    'error': 'error',
    'warning': 'warning',
    'info': 'info',
    'loading': 'loading'
  };
  
  return validTypes[type] || 'info';
};

// 便捷的显示消息方法
export async function showMessage(type: string = 'info', msg: string) {
  try {
    const messageApi: MessageInstance = await initMessageContainer();
    
    messageApi.destroy(); // 清除之前的消息
    messageApi.open({
      type: getValidMessageType(type),
      content: msg,
      duration: type === 'loading' ? 0 : 3,
    });
    
    return messageApi;
  } catch (error) {
    console.error('显示消息失败:', error);
    // 降级方案：使用浏览器原生alert
    alert(msg);
  }
}