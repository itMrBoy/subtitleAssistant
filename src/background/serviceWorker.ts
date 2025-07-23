import { handleSubtitleDownload } from "../utils/utils";
import { getVideoIdFromUrl } from "../utils/utils";
chrome.runtime.onInstalled.addListener(() => { 
  // 创建右键菜单
  chrome.contextMenus.create({
    id: "menu-1",
    type:"normal",
    title: "视频转讲义并下载",
    contexts: ["all"],
  })
})


chrome.contextMenus.onClicked.addListener((data: chrome.contextMenus.OnClickData) => { 
  if(data.menuItemId === "menu-1") {
    const url = getVideoIdFromUrl(data.pageUrl || "")
    handleSubtitleDownload(url)
  }
})