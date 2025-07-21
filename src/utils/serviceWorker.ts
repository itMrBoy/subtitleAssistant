export const sendMsgByServiceWorker = (type: string, data: string, msg: string) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type,
        data,
        msg: `【youtube字幕提取助手】：${msg}`
      });
    }
  });
}

export const downloadFile = (md: string, filename: string) => {
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
}