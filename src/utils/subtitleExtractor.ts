// YouTube字幕提取工具
export interface SubtitleItem {
  text: string;
  start: number;
  duration: number;
}

export interface SubtitleData {
  subtitles: SubtitleItem[];
  language: string;
  videoId: string;
  title: string;
}

/**
 * 从YouTube页面提取字幕 - 方案1：页面元素提取
 */
export async function extractSubtitlesFromPage(): Promise<SubtitleData | null> {
  try {
    // 获取视频ID
    const videoId = getVideoIdFromUrl();
    if (!videoId) return null;

    // 获取视频标题
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.ytd-video-primary-info-renderer .title');
    const title = titleElement?.textContent?.trim() || 'Unknown Title';

    // 尝试从播放器获取字幕
    const player = document.querySelector('#movie_player') as HTMLElement & { getSubtitlesUserSettings?: () => unknown };
    if (player && player.getSubtitlesUserSettings) {
      const subtitles = await extractFromPlayer(player);
      if (subtitles.length > 0) {
        return {
          subtitles,
          language: 'auto',
          videoId,
          title
        };
      }
    }

    // 备用方案：从字幕按钮获取
    const subtitlesFromButton = await extractFromSubtitleButton();
    if (subtitlesFromButton.length > 0) {
      return {
        subtitles: subtitlesFromButton,
        language: 'auto',
        videoId,
        title
      };
    }

    return null;
  } catch (error) {
    console.error('页面字幕提取失败:', error);
    return null;
  }
}

/**
 * 从播放器对象提取字幕
 */
async function extractFromPlayer(player: HTMLElement & { getSubtitlesUserSettings?: () => unknown }): Promise<SubtitleItem[]> {
  try {
    // 尝试获取字幕轨道
    const settings = player.getSubtitlesUserSettings?.() as { track?: unknown } | undefined;
    const tracks = settings?.track;
    if (!tracks) return [];

    // 这里需要根据YouTube播放器API的具体实现来调整
    // 实际实现可能需要更复杂的逻辑
    return [];
  } catch (error) {
    console.error('从播放器提取字幕失败:', error);
    return [];
  }
}

/**
 * 通过字幕按钮获取字幕
 */
async function extractFromSubtitleButton(): Promise<SubtitleItem[]> {
  try {
    // 查找字幕按钮
    const subtitleButton = document.querySelector('button[data-tooltip-target-id*="caption"], .ytp-subtitles-button');
    
    if (!subtitleButton) {
      console.log('未找到字幕按钮');
      return [];
    }

    // 检查字幕是否已启用
    const isEnabled = subtitleButton.getAttribute('aria-pressed') === 'true';
    
    if (!isEnabled) {
      // 点击启用字幕
      (subtitleButton as HTMLElement).click();
      // 等待字幕加载
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 等待并获取字幕容器
    const subtitleContainer = await waitForElement('.ytp-caption-window-container, .caption-window');
    if (!subtitleContainer) return [];

    // 监听字幕变化并收集文本
    return await collectSubtitlesFromContainer(subtitleContainer);
  } catch (error) {
    console.error('从字幕按钮提取失败:', error);
    return [];
  }
}

/**
 * 等待元素出现
 */
function waitForElement(selector: string, timeout = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * 从字幕容器收集字幕文本
 */
async function collectSubtitlesFromContainer(container: Element): Promise<SubtitleItem[]> {
  const subtitles: SubtitleItem[] = [];
  const collectedTexts = new Set<string>();
  
  // 获取视频元素来计算时间
  const video = document.querySelector('video') as HTMLVideoElement;
  if (!video) return [];

  return new Promise((resolve) => {
    let lastText = '';
    let startTime = 0;
    let collectTimeout: number;

    const observer = new MutationObserver(() => {
      const captionText = container.textContent?.trim() || '';
      
      if (captionText && captionText !== lastText && !collectedTexts.has(captionText)) {
        const currentTime = video.currentTime;
        
        // 如果有上一条字幕，设置其结束时间
        if (lastText && subtitles.length > 0) {
          subtitles[subtitles.length - 1].duration = currentTime - startTime;
        }
        
        // 添加新字幕
        subtitles.push({
          text: captionText,
          start: currentTime,
          duration: 0 // 将在下一条字幕出现时设置
        });
        
        collectedTexts.add(captionText);
        lastText = captionText;
        startTime = currentTime;
        
        // 重置收集超时
        clearTimeout(collectTimeout);
        collectTimeout = setTimeout(() => {
          observer.disconnect();
          resolve(subtitles);
        }, 3000); // 3秒无新字幕则结束收集
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // 10秒后强制结束
    setTimeout(() => {
      observer.disconnect();
      resolve(subtitles);
    }, 10000);
  });
}

/**
 * 从URL获取视频ID
 */
function getVideoIdFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get('v');
}

/**
 * 方案2：通过YouTube内部API获取字幕
 */
export async function extractSubtitlesFromAPI(videoId: string): Promise<SubtitleData | null> {
  try {
    // 尝试从window对象获取YouTube内部数据
    const ytInitialData = (window as unknown as { ytInitialData?: unknown }).ytInitialData;
    const ytInitialPlayerResponse = (window as unknown as { ytInitialPlayerResponse?: unknown }).ytInitialPlayerResponse;
    
    const playerResponse = ytInitialPlayerResponse as { captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: unknown[] } } } | undefined;
    if (playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
      const captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
      
      // 选择第一个可用的字幕轨道
      const track = captionTracks[0] as { baseUrl?: string; languageCode?: string } | undefined;
      if (track?.baseUrl) {
        const subtitleXml = await fetch(track.baseUrl).then(res => res.text());
        const subtitles = parseXMLSubtitles(subtitleXml);
        
        return {
          subtitles,
          language: track.languageCode || 'auto',
          videoId,
          title: (ytInitialData as { contents?: { twoColumnWatchNextResults?: { results?: { results?: { contents?: { videoPrimaryInfoRenderer?: { title?: { runs?: { text?: string }[] } } }[] } } } } } | undefined)?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer?.title?.runs?.[0]?.text || 'Unknown Title'
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('API字幕提取失败:', error);
    return null;
  }
}

/**
 * 解析XML格式的字幕
 */
function parseXMLSubtitles(xmlText: string): SubtitleItem[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const textElements = xmlDoc.querySelectorAll('text');
  
  return Array.from(textElements).map(element => ({
    text: element.textContent?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') || '',
    start: parseFloat(element.getAttribute('start') || '0'),
    duration: parseFloat(element.getAttribute('dur') || '0')
  }));
}

/**
 * 统一字幕提取接口 - 尝试多种方案
 */
export async function extractSubtitles(): Promise<string | null> {
  try {
    const videoId = getVideoIdFromUrl();
    if (!videoId) return null;

    // 方案1：从页面提取
    console.log('尝试从页面提取字幕...');
    let subtitleData = await extractSubtitlesFromPage();
    
    // 方案2：从API提取
    if (!subtitleData || subtitleData.subtitles.length === 0) {
      console.log('尝试从API提取字幕...');
      subtitleData = await extractSubtitlesFromAPI(videoId);
    }
    
    if (!subtitleData || subtitleData.subtitles.length === 0) {
      console.log('未能提取到字幕');
      return null;
    }
    
    // 将字幕转换为文本格式
    const subtitleText = subtitleData.subtitles
      .map(item => item.text)
      .filter(text => text.trim().length > 0)
      .join('\n');
    
    console.log(`成功提取字幕，共 ${subtitleData.subtitles.length} 条`);
    return subtitleText;
    
  } catch (error) {
    console.error('字幕提取失败:', error);
    return null;
  }
} 