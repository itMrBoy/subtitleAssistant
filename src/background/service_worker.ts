import { sendMsgByServiceWorker } from "../utils/serviceWorker";

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
        
        fetch("http://127.0.0.1:4523/m1/6804322-6517891-default/generate", {
        // fetch("https://yt2note-production.up.railway.app/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "vcode": videoId,
            "target_lang": result.Subtitle_Language || "简体中文"
          })
        })
        .then(response => response.json())
        .then(data => {
          console.log('fetch data: ', data)
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
          
          console.log('原始标题:', data.title)
          console.log('安全标题:', safeTitle)
          console.log('最终文件名:', filename)
          
          // 创建包含正确MIME类型的Blob
          const blob = new Blob([md], { type: "text/markdown; charset=utf-8" })
          
          // 在 Service Worker 中使用 chrome.downloads.download 的 data URL 方式
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            chrome.downloads.download({ 
              url: dataUrl, 
              filename: filename,
              saveAs: true
            }, (downloadId) => {
              if (chrome.runtime.lastError) {
                console.error('下载失败:', chrome.runtime.lastError)
                sendMsgByServiceWorker("subtitle_downloading", "error", "下载失败，请稍后重试")
              } else {
                console.log('下载成功，下载ID:', downloadId)
                sendMsgByServiceWorker("subtitle_downloading", "success", `${filename} 下载成功`)
              }
            })
          }
          reader.readAsDataURL(blob)
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