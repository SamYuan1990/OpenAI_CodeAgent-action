/**
 * The entrypoint for the action.
 */
const { runAst } = require('./runAST')
const OpenAI = require('openai')
const { cvss_deployment } = require('./onceoffTasks/cvssDeployment')
const { processOutput } = require('./outputhandler/generalOutputProcessor')
const { predefinePrompt } = require('./Prompotlib')
const { logger } = require('./utils/logger')
const { getInputOrDefault } = require('./utils/inputFilter')

async function run() {
  const baseURL = getInputOrDefault('baseURL', '')
  logger.Info(`We are going to talk with Gen AI with URL ${baseURL}`)

  const apiKey = getInputOrDefault('apiKey', '')
  // creation of AI agent
  const openai = new OpenAI({
    baseURL,
    apiKey
  })
  // controler group
  const dryRun = getInputOrDefault('dryRun', true)
  logger.Info(`dry run? ${dryRun}`)
  const runType = getInputOrDefault('runType', '')
  logger.Info(`Will execute for ${runType}`)
  const folderName = getInputOrDefault('output_path', '/workdir/GenAI_output')
  logger.Info(`Will save running result at ${folderName}`)
  const githubIssueReport = getInputOrDefault('githubIssueReport', false)
  logger.Info(`enable report via github Issue ${githubIssueReport}`)

  const maxIterations = getInputOrDefault('maxIterations', '')
  const control_group = {
    maxIterations,
    runType,
    folderName,
    githubIssueReport
  }
  // end of AI Agent creation
  const model = getInputOrDefault('model', '')
  logger.Info(`We are going to talk with Gen AI with Model ${model}`)
  const defualt_prompt = predefinePrompt(control_group)
  logger.Info(`default prompt ${defualt_prompt}`)
  const prompt = getInputOrDefault('prompt', defualt_prompt)
  logger.Info(
    `We are going to talk with Gen AI with prompt and file content ${prompt}`
  )

  const model_parameters = {
    model,
    prompt
  }

  let LLMresponses = []
  // once off tasks
  if (control_group.runType === 'CVE2Deployment') {
    LLMresponses = await cvss_deployment(openai, model_parameters, dryRun)
  } else {
    // AST tasks
    LLMresponses = await runAst(openai, model_parameters, control_group, dryRun)
  }
  logger.Info(`debug ${LLMresponses.length}`)
  await processOutput(LLMresponses, control_group)
  // Log the current timestamp, wait, then log the new timestamp
  logger.Info(`complete at: ${new Date().toTimeString()}`)
}

//run()

module.exports = {
  run
}
