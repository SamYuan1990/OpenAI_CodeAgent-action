const OpenAI = require('openai')
const core = require('@actions/core')

async function invokeAIviaAgent(baseURL, apiKey, fileContent, prompt) {
  const openai = new OpenAI({
    baseURL,
    apiKey
  })
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      {
        role: 'user',
        content: `${prompt}\n${fileContent}`
      }
    ],
    model: 'deepseek-chat'
  })
  core.debug(completion.choices[0].message.content)
  return completion.choices[0].message.content
}

module.exports = {
  invokeAIviaAgent
}
