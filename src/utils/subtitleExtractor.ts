import { getVideoIdFromUrl } from "./utils";
import { ClientType, Innertube } from 'youtubei.js/web'

export async function getTranscript(videoId: string, lang = 'zh') {
  try {
    const yt = await Innertube.create({
      client_type: ClientType.WEB,
      lang: lang,
      fetch: async (input, url) => {
        return fetch(input, url)
      },
    })
    const info = await yt.getInfo(videoId)
    const scriptInfo = await info.getTranscript()
    return scriptInfo.transcript?.content?.body?.initial_segments?.map((segment) => ({
      text: segment.snippet.text,
      startMs: segment.start_ms,
      endMs: segment.end_ms,
    }))
  } catch (error) {
    console.error('getTranscript error: ', error)
    return null
  }
}

export async function extractSubtitles(): Promise<string | null> {
  try {
    const { videoId } = getVideoIdFromUrl(window.location.href);
    if (!videoId) return null;

    const subtitleData = await getTranscript(videoId)
    
    if (!subtitleData || subtitleData.length === 0) {
      return null;
    }
    const subtitleText = subtitleData.reduce((pre, text) => {
      return pre + text.text + '\n'
    }, '');
    return subtitleText;
    
  } catch (error) {
    console.error('字幕提取失败:', error);
    return null;
  }
} 