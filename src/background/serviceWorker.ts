import { downloadFile, handleSubtitleContent } from "../utils/utils";
import { getVideoIdFromUrl } from "../utils/utils";
import { handleSidePanel } from "../utils/serviceWorker";


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
  if (info.menuItemId === 'preview' && tab?.url?.includes('youtube.com')) {
    handleSidePanel(tab)
  }
});