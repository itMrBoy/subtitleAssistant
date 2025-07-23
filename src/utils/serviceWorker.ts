

export const sendMsgByServiceWorker = (type: string, data: string, msg: string) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type,
        data,
        msg: `【youtube字幕提取助手】：${msg}`
      });
    }
  });
}