const core = require('@actions/core')
const {
  ProcessJsUnittest,
  ProcessGoDoc
} = require('./outputhandler/ouputprocessor')
const { fromCVEToPodDeployment } = require('./cve')
const { taskQueue } = require('./orchestration')
const OpenAI = require('openai')
const { invokeAIviaAgent } = require('./aiagent')
const fs = require('fs')
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    // here are the parameters for AI Agent
    const baseURL = core.getInput('baseURL', { required: true })
    const apiKey = core.getInput('apiKey', { required: true })
    const model = core.getInput('model', { required: true })
    const dirPath = core.getInput('dirPath', { required: true })
    const prompt = core.getInput('prompt', { required: true })
    let maxIterations = 0
    maxIterations = core.getInput('maxIterations')
    const runType = core.getInput('runType', { required: true })

    const dryRun = core.getInput('dryRun')
    // creation of AI agent
    core.info(` We are going to talk with Gen AI with URL ${baseURL}`)
    core.info(` We are going to talk with Gen AI with Model${model}`)
    core.info(
      ` We are going to talk with Gen AI with prompt and file content ${prompt}`
    )

    const openai = new OpenAI({
      baseURL,
      apiKey
    })
    // end of AI Agent creation

    taskQueue.setmaxIterations(maxIterations)
    taskQueue.setdirPath(dirPath)
    if (runType === 'godoc') {
      taskQueue.GenerateGoDocTasks()
    }
    if (runType === 'jsunittest') {
      taskQueue.GenerateJsUnitTestTask()
    }
    core.info(`runtype ${runType}`)
    if (runType === 'CVE2Deployment') {
      core.info('running type CVE2Deployment')
      const css_content = await fromCVEToPodDeployment()
      const fileContent = fs.readFileSync(dirPath, 'utf8')
      const content = `${css_content},${fileContent}`
      const LLMresponse = await invokeAIviaAgent(
        openai,
        model,
        prompt,
        dryRun,
        content
      )
      core.setOutput('LLMresponse', LLMresponse)
      return
    }
    const GenAIresponses = await taskQueue.run(openai, model, prompt, dryRun)
    core.info('start processing GenAI result to file')
    if (runType === 'godoc') {
      ProcessGoDoc(GenAIresponses)
    }
    if (runType === 'jsunittest') {
      ProcessJsUnittest(GenAIresponses)
    }
    // Log the current timestamp, wait, then log the new timestamp
    core.debug('complete at:', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
