import { sendMsgByServiceWorker, downloadFile } from "../utils/serviceWorker";
import { fetchMdApi } from "../api/serviceWorker";

chrome.runtime.onInstalled.addListener(() => { 
  // 创建右键菜单
  chrome.contextMenus.create({
    id: "menu-1",
    type:"normal",
    title: "提取字幕并下载为md",
    contexts: ["all"],
  })
})


chrome.contextMenus.onClicked.addListener((data: chrome.contextMenus.OnClickData) => { 
  if(data.menuItemId === "menu-1") {
    chrome.storage.local.get('Subtitle_Language', (result) => {
      const url = new URL(data.pageUrl || "")
      const videoId = url.searchParams.get("v")
      if(url.hostname === "www.youtube.com" && videoId) {
        // 获取当前活动标签页并发送消息给content script
        sendMsgByServiceWorker("subtitle_downloading", "loading", "正在提取字幕...")

        fetchMdApi({
          "vcode": videoId,
          "target_lang": result.Subtitle_Language || "简体中文"
        })
        .then(data => {
          // 验证数据完整性
          if (!data || !data.content) {
            console.error('API返回数据格式错误:', data)
            sendMsgByServiceWorker("subtitle_downloading", "error", "API返回数据格式错误")
            return
          }
          // 下载为md
          const md = data.content

          // 确保文件名有效，添加.md扩展名
          let safeTitle = 'youtube_subtitle'
          if (data.title && typeof data.title === 'string' && data.title.trim()) {
            safeTitle = data.title.replace(/[<>:"/\\|?*]/g, '_').trim()
          }
          const filename = `${safeTitle}.md`

          downloadFile(md, filename)
        })
        .catch(error => {
          console.error("API请求失败:", error);
          // 可以在这里添加用户通知
          sendMsgByServiceWorker("subtitle_downloading", "error", `${error || 'API请求失败，请稍后重试'}`)
        });
      } else {
        sendMsgByServiceWorker("subtitle_downloading", "warning", "当前仅支持提供字幕的youtube视频，请检查视频链接是否正确")
      }
    })
  }
})