const OpenAI = require('openai')

const openAIfactory = {
  baseURL: '',
  apiKey: '',

  GetAccess() {
    // todo if we considering create new or keep session
    const baseURL = this.baseURL
    const apiKey = this.apiKey
    const openai = new OpenAI({
      baseURL,
      apiKey
    })
    return openai
  },

  setBaseURL(baseURL) {
    this.baseURL = baseURL
  },

  setKey(apiKey) {
    this.apiKey = apiKey
  }
}

module.exports = {
  openAIfactory
}
