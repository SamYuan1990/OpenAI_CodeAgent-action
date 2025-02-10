/**
 * The entrypoint for the action.
 */
const { run } = require('./main')
const core = require('@actions/core')
const OpenAI = require('openai')
const cvss_deployment = require('./onceoffTasks/cvssDeployment')
const processOutput = require('./outputhandler/generalOutputProcessor')

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
  let LLMresponses = []
  // once off tasks
  if (control_group.runType === 'CVE2Deployment') {
    LLMresponses = cvss_deployment(openai, model_parameters, dryRun)
  } else {
    // AST tasks
    run(openai, model_parameters, control_group, dryRun)
  }
  processOutput(LLMresponses)
  // Log the current timestamp, wait, then log the new timestamp
  core.debug('complete at:', new Date().toTimeString())
}

start()
