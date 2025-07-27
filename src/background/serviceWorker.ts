import { downloadFile, handleSubtitleContent } from "../utils/utils";
import { getVideoIdFromUrl } from "../utils/utils";
import { handleSidePanel, sendMsgByServiceWorker } from "../utils/serviceWorker";


chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'preview',
    title: '预览讲义',
    contexts: ['all']
  });
  // 创建右键菜单
  chrome.contextMenus.create({
    id: "download",
    type:"normal",
    title: "下载讲义",
    contexts: ["all"],
  })
});

chrome.contextMenus.onClicked.addListener((data: chrome.contextMenus.OnClickData) => { 
  if(data.menuItemId === "download") {
    const url = getVideoIdFromUrl(data.pageUrl || "")
    handleSubtitleContent(url).then((res) => {
      if (res?.md && res?.filename) {
        downloadFile(res.md, res.filename)
      }
    })
  }
})

chrome.contextMenus.onClicked.addListener(async(info, tab) => {
  if (info.menuItemId === 'preview') {
    if (tab?.url?.includes('youtube.com')) {
      try {
        // 在用户手势上下文中立即打开sidepanel
        await chrome.sidePanel.open({ tabId: tab.id, windowId: tab.windowId });
        // 然后处理数据加载（这不需要用户手势上下文）
        handleSidePanel(tab).catch(error => {
          console.error('处理sidepanel数据失败:', error);
        });
      } catch (error) {
        console.error('打开sidepanel失败:', error);
        sendMsgByServiceWorker("preview_error", "error", "打开侧边栏失败");
      }
    } else {
      sendMsgByServiceWorker("preview_error", "error", "当前页面不是YouTube页面，无法预览讲义")
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, _info, tab) => {
// chrome.tabs.query({active: true, currentWindow: true}, async(tabs) => {
//   const tab = tabs[0]
//   const tabId = tab.id
  console.log("tabs active: ", tabId, tab.url);
  
  if (!tab.url) {
    console.log("No URL available, skipping");
    return;
  }
  
  try {
    const url = new URL(tab.url);
    console.log("Parsed URL:", { origin: url.origin, hostname: url.hostname });
    
    // 更精确的YouTube域名匹配
    const isYouTube = url.hostname === 'www.youtube.com' || 
                      url.hostname === 'youtube.com' || 
                      url.hostname === 'm.youtube.com';
    
    console.log("Is YouTube:", isYouTube);
    
    if (isYouTube) {
      console.log("Enabling side panel for YouTube tab:", tabId);
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'src/sidepanel/sidepanel.html',
        enabled: true
      });
    } else {
      console.log("Disabling side panel for non-YouTube tab:", tabId);
      await chrome.sidePanel.setOptions({
        tabId,
        enabled: false
      });
    }
  } catch (error) {
    console.error("Error processing tab update:", error);
  }
});