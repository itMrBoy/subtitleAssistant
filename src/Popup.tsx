import { useState, useEffect } from 'react'
import './popup.css'
import { getVideoIdFromUrl, downloadFile, handleSubtitleContent } from "./utils/utils";

function Popup() {
  const [language, setLanguage] = useState('简体中文')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isYouTubePage, setIsYouTubePage] = useState(false)
  const [curURLInfo, setCurURLInfo] = useState<{ hostname: string, videoId: string }>({ hostname: '', videoId: '' })

  useEffect(() => {
    chrome.storage.local.get('language', (result) => {
      setLanguage(result.language || '简体中文')
    })

    // 检查当前页面是否为YouTube
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTab = tabs[0]
      if (currentTab?.url) {
        const urlInfo = getVideoIdFromUrl(currentTab.url)
        const isYT = urlInfo.hostname === 'www.youtube.com'
        const videoId = urlInfo.videoId
        
        setIsYouTubePage(isYT && !!videoId)
        setCurURLInfo(urlInfo)
      }
    })
  }, [])

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value)
    chrome.storage.local.set({ Subtitle_Language: e.target.value })
  }

  const handleExtractSubtitles = async () => {
    if (!isYouTubePage || !curURLInfo?.videoId) {
      return
    }

    setIsExtracting(true)
    
    handleSubtitleContent(curURLInfo).then((ress = { md: '', filename: '' }) => {
      console.log("res: ", res)
      if (res?.md && res?.filename) {
        downloadFile(res.md, res.filename)
      }
      // window.close()
    }).finally(() => {
      setIsExtracting(false)
    })
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
              {isExtracting ? '正在提取...' : '视频转讲义并下载'}
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
              <p><strong>方式2：</strong>右键菜单 → "视频转讲义并下载"</p>
              <p><strong>方式3：</strong>使用开发者工具面板 (技术用户)</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

export default Popup
