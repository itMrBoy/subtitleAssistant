import { useState, useEffect } from 'react'
import './popup.css'

function Popup() {
  const [language, setLanguage] = useState('简体中文')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isYouTubePage, setIsYouTubePage] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.local.get('language', (result) => {
      setLanguage(result.language || '简体中文')
    })

    // 检查当前页面是否为YouTube
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTab = tabs[0]
      if (currentTab?.url) {
        const url = new URL(currentTab.url)
        const isYT = url.hostname === 'www.youtube.com'
        const videoId = url.searchParams.get('v')
        
        setIsYouTubePage(isYT && !!videoId)
        setCurrentVideoId(videoId)
      }
    })
  }, [])

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value)
    chrome.storage.local.set({ Subtitle_Language: e.target.value })
  }

  const handleExtractSubtitles = async () => {
    if (!isYouTubePage || !currentVideoId) {
      return
    }

    setIsExtracting(true)
    
    try {
      // 向当前标签页发送字幕提取请求
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "extract_subtitles",
            videoId: currentVideoId
          }, (response) => {
            setIsExtracting(false)
            
            if (chrome.runtime.lastError) {
              console.error('发送消息失败:', chrome.runtime.lastError)
              return
            }

            if (response?.success && response.subtitleText) {
              // 字幕提取成功，调用API处理
              chrome.storage.local.get('Subtitle_Language', (result) => {
                fetch("http://127.0.0.1:4523/m1/6804322-6517891-default/v2/generate", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    "transcript_text": response.subtitleText,
                    "target_lang": result.Subtitle_Language || "简体中文"
                  })
                })
                .then(res => res.json())
                .then(data => {
                  if (data && data.content) {
                    // 下载文件
                    const blob = new Blob([data.content], { type: "text/markdown; charset=utf-8" })
                    const url = URL.createObjectURL(blob)
                    
                    let safeTitle = 'youtube_subtitle'
                    if (data.title && typeof data.title === 'string' && data.title.trim()) {
                      safeTitle = data.title.replace(/[<>:"/\\|?*]/g, '_').trim()
                    }
                    const filename = `${safeTitle}.md`
                    
                    const a = document.createElement('a')
                    a.href = url
                    a.download = filename
                    a.click()
                    
                    URL.revokeObjectURL(url)
                    
                    // 关闭popup
                    window.close()
                  }
                })
                .catch(error => {
                  console.error('API请求失败:', error)
                })
              })
            } else {
              console.log('字幕提取失败:', response?.error)
            }
          })
        }
      })
    } catch (error) {
      console.error('提取字幕时出错:', error)
      setIsExtracting(false)
    }
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h3>YouTube字幕助手</h3>
      </div>
      
      <div className="popup-content">
        <div className="language-section">
          <label htmlFor="language-select">目标语言：</label>
          <select 
            id="language-select"
            value={language} 
            onChange={handleLanguageChange}
            className="language-select"
          >
            <option value="简体中文">简体中文</option>
            <option value="繁体中文">繁体中文</option>
            <option value="English">English</option>
            <option value="日本語">日本語</option>
            <option value="한국어">한국어</option>
            <option value="Français">Français</option>
            <option value="Deutsch">Deutsch</option>
            <option value="Español">Español</option>
            <option value="Italiano">Italiano</option>
            <option value="Русский">Русский</option>
          </select>
        </div>

        <div className="extract-section">
          {isYouTubePage ? (
            <button 
              onClick={handleExtractSubtitles}
              disabled={isExtracting}
              className="extract-button"
            >
              {isExtracting ? '正在提取...' : '提取字幕并下载'}
            </button>
          ) : (
            <div className="not-youtube">
              <p>请在YouTube视频页面使用此功能</p>
            </div>
          )}
        </div>

        <div className="help-section">
          <details>
            <summary>使用说明</summary>
            <div className="help-content">
              <p><strong>方式1 (推荐)：</strong>点击上方按钮直接提取</p>
              <p><strong>方式2：</strong>右键菜单 → "提取字幕并下载为md"</p>
              <p><strong>方式3：</strong>使用开发者工具面板 (技术用户)</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

export default Popup
