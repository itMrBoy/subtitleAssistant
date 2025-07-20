import { useState, useEffect } from 'react'
import './popup.css'

function Popup() {
  const [language, setLanguage] = useState('简体中文')


  useEffect(() => {
    chrome.storage.local.get('language', (result) => {
      setLanguage(result.language || '简体中文')
    })
  }, [])

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value)
    chrome.storage.local.set({ Subtitle_Language: e.target.value })
  }

  return (
    <>
      <select value={language} onChange={(e) => handleLanguageChange(e)}>
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
    </>
  )
}

export default Popup
