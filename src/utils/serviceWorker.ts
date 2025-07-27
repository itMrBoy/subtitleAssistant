import { getVideoIdFromUrl, handleSubtitleContent } from "./utils";

export const sendMsgByServiceWorker = (type: string, data: string, msg: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type,
                data,
                msg: `【youtube字幕提取助手】：${msg}`
            });
        }
    });
}

// 定义消息类型接口
interface SubtitleResult {
    md: string;
    filename: string;
}

// 定义消息类型
interface MessageToSidePanel {
    type: string;
    videoId?: string;
    md?: string;
    filename?: string;
    error?: string;
}

// 发送消息的辅助函数，使用Promise形式
const sendMessageToSidePanel = async (message: MessageToSidePanel): Promise<void> => {
    try {
        await chrome.runtime.sendMessage(message);
        console.log('消息发送成功:', message.type);
    } catch (error) {
        console.error('发送消息失败:', error);
        // 如果是因为接收方不存在，可能是sidepanel还没有加载完成
        if (error && (error as Error).message?.includes('Receiving end does not exist')) {
            console.warn('Sidepanel可能还没有准备好接收消息，等待重试...');
            // 等待一段时间后重试
            setTimeout(async () => {
                try {
                    await chrome.runtime.sendMessage(message);
                    console.log('重试发送消息成功:', message.type);
                } catch (retryError) {
                    console.error('重试发送消息仍然失败:', retryError);
                }
            }, 1000);
        }
    }
};

export const handleSidePanel = async (tab: chrome.tabs.Tab) => {
    try {
        // 打开sidepanel, 且在service worker中不允许放在异步操作之后，否则sidepanel会因为丢失gesture作用域而无法打开
        await chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });

        // 确保为该标签页配置了sidepanel
        await chrome.sidePanel.setOptions({
            tabId: tab.id,
            path: 'src/sidepanel/sidepanel.html',
            enabled: true
        });

        // 等待sidepanel加载完成
        await new Promise(resolve => setTimeout(resolve, 500));

        // 发送loading状态到sidepanel
        await sendMessageToSidePanel({
            type: "preview_loading"
        });

        const url = getVideoIdFromUrl(tab?.url || '')

        try {
            const result = await handleSubtitleContent(url);
            // handleSubtitleContent 应该返回 { md: string, filename: string } 或者抛出错误
            const res: SubtitleResult = result as SubtitleResult;

            // 发送预览数据到sidepanel
            await sendMessageToSidePanel({
                type: "preview_success",
                videoId: url.videoId,
                md: res.md,
                filename: res.filename
            });
        } catch (error) {
            console.error('字幕处理失败:', error);

            // 发送错误消息到sidepanel
            await sendMessageToSidePanel({
                type: "preview_error",
                error: error instanceof Error ? error.message : error?.toString() || '未知错误'
            });
        }
    } catch (error) {
        console.error('处理sidepanel操作失败:', error);
    }
}