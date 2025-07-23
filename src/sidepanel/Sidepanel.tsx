import { useState, useEffect } from 'react'
import Markdown from 'markdown-to-jsx'
import { downloadFile } from '../utils/utils'

interface SubtitleData {
  md: string;
  filename: string;
  videoId: string;
}

interface MessageData {
  type: string;
  md?: string;
  filename?: string;
  videoId?: string;
  error?: string;
}

function SidePanel() {
  const [loading, setLoading] = useState(false)
  const [subtitleData, setSubtitleData] = useState<SubtitleData | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // 监听来自background script的消息
    const messageListener = (
      message: MessageData,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: { success: boolean }) => void
    ) => {
      if (message.type === 'preview_success') {
        setLoading(false)
        setError('')
        setSubtitleData({
          md: message.md || '',
          filename: message.filename || '',
          videoId: message.videoId || ''
        })
        sendResponse({ success: true })
      } else if (message.type === 'preview_loading') {
        setLoading(true)
        setError('')
        setSubtitleData(null)
        sendResponse({ success: true })
      } else if (message.type === 'preview_error') {
        setLoading(false)
        setError(message.error || '处理失败')
        setSubtitleData(null)
        sendResponse({ success: true })
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }, [])

  const handleDownload = () => {
    if (subtitleData) {
      downloadFile(subtitleData.md, subtitleData.filename)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      height: '100vh', 
      overflow: 'auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        borderBottom: '1px solid #e1e5e9',
        paddingBottom: '16px',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          margin: '0 0 8px 0',
          color: '#1a73e8'
        }}>
          YouTube讲义预览
        </h1>
        <p style={{ 
          margin: '0', 
          color: '#5f6368', 
          fontSize: '14px' 
        }}>
          右键选择"预览讲义"来查看讲义内容
        </p>
      </div>

      {loading && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          color: '#5f6368'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e1e5e9',
            borderTop: '3px solid #1a73e8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <p style={{ margin: '0', fontSize: '14px' }}>正在处理字幕...</p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fce8e6',
          border: '1px solid #fad2cf',
          borderRadius: '8px',
          color: '#d93025',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          <strong>错误：</strong>{error}
        </div>
      )}

      {subtitleData && !loading && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e1e5e9'
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '16px', 
                fontWeight: '500',
                color: '#202124'
              }}>
                {subtitleData.filename}
              </h3>
              <p style={{ 
                margin: '0', 
                fontSize: '12px', 
                color: '#5f6368' 
              }}>
                视频ID: {subtitleData.videoId}
              </p>
            </div>
            <button
              onClick={handleDownload}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1a73e8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1557b0'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#1a73e8'
              }}
            >
              📥 下载
            </button>
          </div>

          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '8px',
            padding: '20px',
            lineHeight: '1.6',
            color: '#202124'
          }}>
            <Markdown 
              options={{
                overrides: {
                  h1: {
                    props: {
                      style: { 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        marginBottom: '16px',
                        color: '#202124'
                      }
                    }
                  },
                  h2: {
                    props: {
                      style: { 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        marginBottom: '12px',
                        color: '#202124'
                      }
                    }
                  },
                  h3: {
                    props: {
                      style: { 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        color: '#202124'
                      }
                    }
                  },
                  p: {
                    props: {
                      style: { 
                        marginBottom: '8px', 
                        lineHeight: '1.6',
                        color: '#202124'
                      }
                    }
                  },
                  li: {
                    props: {
                      style: { 
                        marginBottom: '4px',
                        color: '#202124'
                      }
                    }
                  },
                  ul: {
                    props: {
                      style: { 
                        paddingLeft: '20px',
                        marginBottom: '8px'
                      }
                    }
                  },
                  ol: {
                    props: {
                      style: { 
                        paddingLeft: '20px',
                        marginBottom: '8px'
                      }
                    }
                  },
                  blockquote: {
                    props: {
                      style: { 
                        borderLeft: '4px solid #e1e5e9',
                        paddingLeft: '16px',
                        marginLeft: '0',
                        marginBottom: '8px',
                        fontStyle: 'italic',
                        color: '#5f6368'
                      }
                    }
                  },
                  code: {
                    props: {
                      style: { 
                        backgroundColor: '#f8f9fa',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontSize: '90%',
                        fontFamily: 'monospace'
                      }
                    }
                  },
                  pre: {
                    props: {
                      style: { 
                        backgroundColor: '#f8f9fa',
                        padding: '12px',
                        borderRadius: '6px',
                        overflow: 'auto',
                        marginBottom: '8px'
                      }
                    }
                  }
                }
              }}
            >
              {subtitleData.md}
            </Markdown>
          </div>
        </div>
      )}

      {!loading && !error && !subtitleData && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#5f6368'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '500' }}>
            暂无内容
          </h3>
          <p style={{ margin: '0', fontSize: '14px' }}>
            在YouTube视频页面右键选择"预览讲义"来开始
          </p>
        </div>
      )}
    </div>
  )
}

export default SidePanel
