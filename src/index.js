/**
 * The entrypoint for the action.
 */
const { run } = require('./main')
const core = require('@actions/core')
const OpenAI = require('openai')
const { fromCVEToPodDeployment } = require('./cve')
const { invokeAIviaAgent } = require('./aiagent')
const fs = require('fs')

async function start() {
  const baseURL = core.getInput('baseURL', { required: true })
  core.info(`We are going to talk with Gen AI with URL ${baseURL}`)

  const apiKey = core.getInput('apiKey', { required: true })
  // creation of AI agent
  const openai = new OpenAI({
    baseURL,
    apiKey
  })
  // end of AI Agent creation
  const model = core.getInput('model', { required: true })
  core.info(`We are going to talk with Gen AI with Model${model}`)
  const prompt = core.getInput('prompt', { required: true })
  core.info(
    `We are going to talk with Gen AI with prompt and file content ${prompt}`
  )

  const model_parameters = {
    model,
    prompt
  }

  // controler group
  const dryRun = core.getInput('dryRun')
  core.info(`dry run? ${dryRun}`)
  const runType = core.getInput('runType', { required: true })
  core.info(`Will execute for ${runType}`)

  const maxIterations = core.getInput('maxIterations')
  const control_group = {
    maxIterations,
    runType
  }

  // once off tasks
  if (control_group.runType === 'CVE2Deployment') {
    core.info('running type CVE2Deployment')
    const deploymentfile = core.getInput('deploymentfile', { required: true })
    const css_content = await fromCVEToPodDeployment()
    const fileContent = fs.readFileSync(deploymentfile, 'utf8')
    const content = `${css_content},${fileContent}`
    const LLMresponse = await invokeAIviaAgent(
      openai,
      model_parameters.model,
      model_parameters.prompt,
      dryRun,
      content
    )
    // output processor
    core.setOutput('LLMresponse', LLMresponse)
    // General output to folder
    // Set Action output
    return
  }
  // AST tasks
  run(openai, model_parameters, control_group, dryRun)
}

start()

// Log the current timestamp, wait, then log the new timestamp
core.debug('complete at:', new Date().toTimeString())
