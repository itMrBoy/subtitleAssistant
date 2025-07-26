import { fetchMdApi, fetchMdV2Api } from "../api/serviceWorker";
import { sendMsgByServiceWorker } from "./serviceWorker";

/**
 * 从URL获取视频ID
 */
export function getVideoIdFromUrl(urlPath: string): { hostname: string, videoId: string } {
  const url = new URL(urlPath);
  return {
    hostname: url.hostname,
    videoId: url.searchParams.get('v') || ""
  }
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
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('下载失败:', chrome.runtime.lastError)
        sendMsgByServiceWorker("subtitle_downloading", "error", "下载失败，请稍后重试")
      } else {
        sendMsgByServiceWorker("subtitle_downloading", "success", `${filename} 下载成功`)
      }
    })
  }
  reader.readAsDataURL(blob)
}

export const handleSubtitleContent = (url: { hostname: string, videoId: string } = { hostname: "", videoId: "" }): Promise<{ md: string; filename: string }> => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('Subtitle_Language', (result) => {
      if (url.hostname === "www.youtube.com" && url.videoId) {
        // 获取当前活动标签页并发送消息给content script
        sendMsgByServiceWorker("subtitle_downloading", "loading", "正在提取字幕...")

        // 向content script发送消息请求提取字幕
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "extract_subtitles",
              videoId: url.videoId
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('发送消息失败:', chrome.runtime.lastError);
                sendMsgByServiceWorker("subtitle_downloading", "error", "页面通信失败，请刷新页面重试");
                reject('页面通信失败，请刷新页面重试')
                return;
              }

              const subtitleText = response?.subtitleText;

              if (!subtitleText) {
                // 如果无法提取字幕，回退到传递videoId的方式
                sendMsgByServiceWorker("subtitle_downloading", "loading", "未能提取到字幕文本，尝试使用视频ID...")

                fetchMdApi({
                  "vcode": url.videoId,
                  "target_lang": result.Subtitle_Language || "简体中文"
                })
                  .then(handleApiResponse)
                  .catch(handleApiError);
                return;
              }

              // 使用提取到的字幕文本
              sendMsgByServiceWorker("subtitle_downloading", "loading", "正在处理字幕文本...")

              fetchMdV2Api({
                "transcript_text": subtitleText,
                "target_lang": result.Subtitle_Language || "简体中文"
              })
                .then(handleApiResponse)
                .catch(handleApiError);
            });
          } else {
            sendMsgByServiceWorker("subtitle_downloading", "error", "无法获取当前标签页");
            reject('无法获取当前标签页')
          }
        });

        function handleApiResponse(data: { content?: string; title?: string }) {
          // 验证数据完整性
          if (!data || !data.content) {
            console.error('API返回数据格式错误:', data)
            sendMsgByServiceWorker("subtitle_downloading", "error", "API返回数据格式错误")
            reject('API返回数据格式错误')
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

          sendMsgByServiceWorker("subtitle_downloading", "success", `${filename} 解析成功`)
          // downloadFile(md, filename)
          resolve({ md, filename })
        }

        function handleApiError(error: unknown) {
          console.error("API请求失败:", error);
          sendMsgByServiceWorker("subtitle_downloading", "error", `${error || 'API请求失败，请稍后重试'}`)
          reject(error)
        }
      } else {
        sendMsgByServiceWorker("subtitle_downloading", "warning", "当前仅支持提供字幕的youtube视频，请检查视频链接是否正确")
        reject('当前仅支持提供字幕的youtube视频，请检查视频链接是否正确')
      }
    })
  })
}