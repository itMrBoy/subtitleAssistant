import React, { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface SimpleMermaidDiagramProps {
  code: string
}

const SimpleMermaidDiagram: React.FC<SimpleMermaidDiagramProps> = ({ code }) => {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current || !code.trim()) {
        return
      }

      try {
        // 确保 Mermaid 已初始化
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose'
        })

        // 生成唯一 ID
        const id = `mermaid-${Date.now()}`
        
        // 清空之前的内容
        elementRef.current.innerHTML = '正在渲染图表...'
        
        // 渲染图表
        const { svg } = await mermaid.render(id, code.trim())
        
        if (elementRef.current) {
          elementRef.current.innerHTML = svg
        }

      } catch (err) {
        console.error('Mermaid 渲染失败:', err)
        if (elementRef.current) {
          elementRef.current.innerHTML = `
            <div style="color: red; padding: 10px; border: 1px solid red; border-radius: 4px;">
              <strong>渲染错误:</strong> ${err}
              <details style="margin-top: 8px;">
                <summary>原始代码</summary>
                <pre style="background: #f5f5f5; padding: 8px; margin-top: 4px;">${code}</pre>
              </details>
            </div>
          `
        }
      }
    }

    renderDiagram()
  }, [code])

  return (
    <div 
      ref={elementRef}
      style={{
        padding: '16px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e1e5e9',
        borderRadius: '8px',
        minHeight: '100px'
      }}
    >
      正在加载...
    </div>
  )
}

export default SimpleMermaidDiagram 