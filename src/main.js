/**
 * The entrypoint for the action.
 */
const { runAst } = require('./runAST')
const OpenAI = require('openai')
const { cvss_deployment } = require('./onceoffTasks/cvssDeployment')
const { CVEDependency } = require('./onceoffTasks/cve_code')
const { processOutput } = require('./outputhandler/generalOutputProcessor')
const { predefinePrompt } = require('./Prompotlib')
const { logger } = require('./utils/logger')
const { getInputOrDefault } = require('./utils/inputFilter')
const fs = require('fs')
const path = require('path')

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
  const dryRun = getInputOrDefault('dryRun', '')
  logger.Info(`dry run? ${dryRun}`)
  const runType = getInputOrDefault('runType', '')
  logger.Info(`Will execute for ${runType}`)
  const folderName = getInputOrDefault('output_path', '/workdir/GenAI_output')
  logger.Info(`Will save running result at ${folderName}`)
  const outputpath = fs.mkdirSync(folderName, {
    recursive: true,
    permission: 0o755
  })
  if (outputpath != null) {
    const absolutePath = path.resolve(outputpath)
    logger.Info(`make output dir, ${absolutePath}`)
  }
  const dirPath = getInputOrDefault('dirPath', '')

  // optional
  const deploymentfile = getInputOrDefault('deploymentfile', '')

  // optional just for open github issue
  const githubIssueReport = getInputOrDefault('githubIssueReport', false)
  logger.Info(`enable report via github Issue ${githubIssueReport}`)

  const maxIterations = getInputOrDefault('maxIterations', '')
  const control_group = {
    maxIterations,
    runType,
    folderName,
    githubIssueReport,
    dirPath,
    deploymentfile
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
  switch (control_group.runType) {
    case 'CVE2Deployment':
      LLMresponses = await cvss_deployment(
        openai,
        model_parameters,
        control_group,
        dryRun
      )
      break
    case 'CVEDependency':
      LLMresponses = await CVEDependency(
        openai,
        model_parameters,
        control_group,
        dryRun
      )
      break
    default:
      LLMresponses = await runAst(
        openai,
        model_parameters,
        control_group,
        dryRun
      )
      break
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
