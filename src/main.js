const core = require('@actions/core')
const OpenAI = require('openai')
const fs = require('fs')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const baseURL = core.getInput('baseURL', { required: true })
    const apiKey = core.getInput('apiKey', { required: true })
    const fileOverWrite = core.getInput('fileOverWrite', { required: true })
    const filePath = './src/main.js'
    const testfilePath = `./__tests__/main.test.js`

    const fileContent = readFileSync(filePath)
    const regex = /```javascript([\s\S]*?)```([\r|\n]*?)###/g

    core.debug('start at:', new Date().toTimeString())
    const dataFromAIAgent = await invokeAIviaAgent(baseURL, apiKey, fileContent)
    const matches = dataFromAIAgent.match(regex)

    if (matches) {
      const contents = matches.map(match =>
        match.replace(/```javascript|```([\r|\n]*?)###/g, '').trim()
      )
      if (fileOverWrite === 'true') {
        writeFileForAarray(testfilePath, contents)
      } else {
        core.info(contents)
      }
      core.debug('content:', contents)
    } else {
      core.info('content not found')
    }
    // Log the current timestamp, wait, then log the new timestamp
    core.debug('complete at:', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

function writeFileForAarray(filePath, content) {
  const WriteContent = content.join()
  core.debug(WriteContent)
  try {
    fs.writeFileSync(filePath, WriteContent, 'utf8')
    core.info('file writed')
  } catch (err) {
    core.info('file write error:', err)
  }
}

function readFileSync(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return data
  } catch (err) {
    console.error('error read file:', err)
    return null
  }
}

async function invokeAIviaAgent(baseURL, apiKey, fileContent) {
  if (apiKey === 'dummy') {
    return `hello world`
  }

  const openai = new OpenAI({
    baseURL,
    apiKey
  })
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      {
        role: 'user',
        content: `Please help me create unit test file with jest framework, using spyOn but not mock the require package for following, all the content in a single file:\n${fileContent}`
      }
    ],
    model: 'deepseek-chat'
  })
  core.debug(completion.choices[0].message.content)
  return completion.choices[0].message.content
}

module.exports = {
  run,
  writeFileForAarray,
  readFileSync,
  invokeAIviaAgent
}
