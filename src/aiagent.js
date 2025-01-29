const OpenAI = require('openai')
const core = require('@actions/core')

async function invokeAIviaAgent(baseURL, apiKey, fileContent, prompt, model) {
  core.info(' We are going to talk with Gen AI with URL', baseURL)
  core.info(' We are going to talk with Gen AI with Model', model)
  core.info(' We are going to talk with Gen AI with prompt and file content')
  core.info(`${prompt}\n${fileContent}`)
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
    model
  })
  core.info('--------This is output from generate AI:--------')
  core.info(completion.choices[0].message.content)
  core.info('--------End of generate AI output--------')
  return completion.choices[0].message.content
}

module.exports = {
  invokeAIviaAgent
}
