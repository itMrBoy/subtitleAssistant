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