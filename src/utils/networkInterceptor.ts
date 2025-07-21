// 网络拦截字幕提取器 - 高级方案
export interface InterceptedSubtitle {
  text: string;
  start: number;
  duration: number;
}

export interface InterceptedSubtitleData {
  subtitles: InterceptedSubtitle[];
  language: string;
  videoId: string;
  source: 'intercepted';
}

class NetworkSubtitleInterceptor {
  private subtitleCache = new Map<string, InterceptedSubtitleData>();
  private interceptorActive = false;
  private originalFetch: typeof fetch;

  constructor() {
    this.originalFetch = window.fetch;
    this.setupInterceptor();
  }

  /**
   * 设置网络拦截器
   */
  private setupInterceptor() {
    // 拦截fetch请求
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      // 检查是否是字幕相关请求
      if (this.isSubtitleRequest(url)) {
        console.log('拦截到字幕请求:', url);
        
        try {
          const response = await this.originalFetch(input, init);
          const clonedResponse = response.clone();
          
          // 异步处理字幕数据，不影响原始请求
          this.processSubtitleResponse(url, clonedResponse);
          
          return response;
        } catch (error) {
          console.error('字幕请求拦截失败:', error);
          return this.originalFetch(input, init);
        }
      }
      
      return this.originalFetch(input, init);
    };

    // 拦截XMLHttpRequest
    this.interceptXHR();
  }

  /**
   * 拦截XMLHttpRequest
   */
  private interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: unknown[]) {
      const urlString = url.toString();
      
      if (self.isSubtitleRequest(urlString)) {
        console.log('XHR拦截到字幕请求:', urlString);
        
        // 保存原始回调
        const originalOnLoad = this.onload;
        const originalOnReadyStateChange = this.onreadystatechange;
        
        this.onreadystatechange = function() {
          if (this.readyState === 4 && this.status === 200) {
            self.processSubtitleText(urlString, this.responseText);
          }
          
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.call(this);
          }
        };
        
        this.onload = function(event: ProgressEvent<XMLHttpRequestEventTarget>) {
          if (this.status === 200) {
            self.processSubtitleText(urlString, this.responseText);
          }
          
          if (originalOnLoad) {
            originalOnLoad.call(this, event);
          }
        };
      }
      
      return originalOpen.call(this, method, url, ...args);
    };
  }

  /**
   * 检查是否是字幕请求
   */
  private isSubtitleRequest(url: string): boolean {
    const subtitlePatterns = [
      /timedtext\?/,
      /caption\?/,
      /subtitle/,
      /srv3\?/,
      /api\/timedtext/,
      /get_video_info.*&captions/
    ];
    
    return subtitlePatterns.some(pattern => pattern.test(url));
  }

  /**
   * 处理字幕响应
   */
  private async processSubtitleResponse(url: string, response: Response) {
    try {
      const text = await response.text();
      this.processSubtitleText(url, text);
    } catch (error) {
      console.error('处理字幕响应失败:', error);
    }
  }

  /**
   * 处理字幕文本
   */
  private processSubtitleText(url: string, text: string) {
    try {
      const videoId = this.extractVideoIdFromUrl(url);
      if (!videoId) return;

      let subtitles: InterceptedSubtitle[] = [];
      let language = 'auto';

      // 尝试解析不同格式的字幕
      if (text.includes('<?xml')) {
        // XML格式字幕
        subtitles = this.parseXMLSubtitles(text);
      } else if (text.includes('"events"')) {
        // JSON格式字幕
        subtitles = this.parseJSONSubtitles(text);
      } else if (text.includes('WEBVTT')) {
        // WebVTT格式字幕
        subtitles = this.parseWebVTTSubtitles(text);
      } else {
        // 纯文本格式
        subtitles = this.parsePlainTextSubtitles(text);
      }

      // 提取语言信息
      language = this.extractLanguageFromUrl(url) || 'auto';

      if (subtitles.length > 0) {
        const subtitleData: InterceptedSubtitleData = {
          subtitles,
          language,
          videoId,
          source: 'intercepted'
        };

        this.subtitleCache.set(videoId, subtitleData);
        console.log(`网络拦截成功获取字幕: ${videoId}, 共${subtitles.length}条`);
        
        // 发送事件通知
        this.notifySubtitleExtracted(subtitleData);
      }
    } catch (error) {
      console.error('处理字幕文本失败:', error);
    }
  }

  /**
   * 解析XML格式字幕
   */
  private parseXMLSubtitles(xmlText: string): InterceptedSubtitle[] {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const textElements = xmlDoc.querySelectorAll('text, p');
      
      return Array.from(textElements).map(element => ({
        text: this.cleanSubtitleText(element.textContent || ''),
        start: parseFloat(element.getAttribute('start') || element.getAttribute('t') || '0') / 1000,
        duration: parseFloat(element.getAttribute('dur') || element.getAttribute('d') || '0') / 1000
      })).filter(item => item.text.trim().length > 0);
    } catch (error) {
      console.error('解析XML字幕失败:', error);
      return [];
    }
  }

  /**
   * 解析JSON格式字幕
   */
  private parseJSONSubtitles(jsonText: string): InterceptedSubtitle[] {
    try {
      const data = JSON.parse(jsonText);
      const events = data.events || [];
      
      return events
        .filter((event: { segs?: unknown[] }) => event.segs)
        .map((event: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string }[] }) => ({
          text: this.cleanSubtitleText(event.segs?.map(seg => seg.utf8).join('') || ''),
          start: (event.tStartMs || 0) / 1000,
          duration: (event.dDurationMs || 0) / 1000
        }))
        .filter(item => item.text.trim().length > 0);
    } catch (error) {
      console.error('解析JSON字幕失败:', error);
      return [];
    }
  }

  /**
   * 解析WebVTT格式字幕
   */
  private parseWebVTTSubtitles(vttText: string): InterceptedSubtitle[] {
    try {
      const lines = vttText.split('\n');
      const subtitles: InterceptedSubtitle[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 匹配时间戳行 (00:00:00.000 --> 00:00:03.000)
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timeMatch && lines[i + 1]) {
          const start = this.parseTimeToSeconds(timeMatch[1]);
          const end = this.parseTimeToSeconds(timeMatch[2]);
          const text = this.cleanSubtitleText(lines[i + 1].trim());
          
          if (text) {
            subtitles.push({
              text,
              start,
              duration: end - start
            });
          }
        }
      }
      
      return subtitles;
    } catch (error) {
      console.error('解析WebVTT字幕失败:', error);
      return [];
    }
  }

  /**
   * 解析纯文本字幕
   */
  private parsePlainTextSubtitles(text: string): InterceptedSubtitle[] {
    const lines = text.split('\n')
      .map(line => this.cleanSubtitleText(line))
      .filter(line => line.length > 0);
    
    return lines.map((text, index) => ({
      text,
      start: index * 3, // 假设每3秒一条字幕
      duration: 3
    }));
  }

  /**
   * 清理字幕文本
   */
  private cleanSubtitleText(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
  }

  /**
   * 解析时间字符串为秒数
   */
  private parseTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(':');
    const seconds = parseFloat(parts[2]);
    const minutes = parseInt(parts[1], 10);
    const hours = parseInt(parts[0], 10);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 从URL提取视频ID
   */
  private extractVideoIdFromUrl(url: string): string | null {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  /**
   * 从URL提取语言信息
   */
  private extractLanguageFromUrl(url: string): string | null {
    const langMatch = url.match(/[?&]lang=([^&]+)/);
    return langMatch ? langMatch[1] : null;
  }

  /**
   * 通知字幕提取完成
   */
  private notifySubtitleExtracted(subtitleData: InterceptedSubtitleData) {
    // 发送自定义事件
    const event = new CustomEvent('subtitleExtracted', {
      detail: subtitleData
    });
    document.dispatchEvent(event);
  }

  /**
   * 获取缓存的字幕
   */
  public getCachedSubtitles(videoId: string): InterceptedSubtitleData | null {
    return this.subtitleCache.get(videoId) || null;
  }

  /**
   * 清除缓存
   */
  public clearCache() {
    this.subtitleCache.clear();
  }

  /**
   * 获取字幕文本
   */
  public getSubtitleText(videoId: string): string | null {
    const data = this.getCachedSubtitles(videoId);
    if (!data) return null;
    
    return data.subtitles
      .map(item => item.text)
      .filter(text => text.trim().length > 0)
      .join('\n');
  }

  /**
   * 启用拦截器
   */
  public enable() {
    this.interceptorActive = true;
  }

  /**
   * 禁用拦截器
   */
  public disable() {
    this.interceptorActive = false;
    // 恢复原始fetch
    window.fetch = this.originalFetch;
  }

  /**
   * 检查是否有新的字幕数据
   */
  public hasSubtitles(videoId: string): boolean {
    return this.subtitleCache.has(videoId);
  }
}

// 创建全局实例
const networkInterceptor = new NetworkSubtitleInterceptor();

// 导出接口
export function getNetworkInterceptor(): NetworkSubtitleInterceptor {
  return networkInterceptor;
}

export function getInterceptedSubtitles(videoId: string): string | null {
  return networkInterceptor.getSubtitleText(videoId);
}

export function hasInterceptedSubtitles(videoId: string): boolean {
  return networkInterceptor.hasSubtitles(videoId);
}

// 自动启用拦截器
networkInterceptor.enable();

// 监听页面卸载，清理资源
window.addEventListener('beforeunload', () => {
  networkInterceptor.disable();
}); 