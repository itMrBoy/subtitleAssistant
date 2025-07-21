export const fetchMdApi = (data: object = {}) => {
  return fetch("http://127.0.0.1:4523/m1/6804322-6517891-default/generate", {
    // fetch("https://yt2note-production.up.railway.app/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
}