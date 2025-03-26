/**
 * The entrypoint for the action.
 */
const { runAst } = require('./runAST')
const { openAIfactory } = require('./agents/aiconnectfactory')
const { cvss_deployment } = require('./onceoffTasks/cvssDeployment')
const { CVEDependency } = require('./onceoffTasks/cve_code')
const { CVEDeep } = require('./onceoffTasks/cve_file')
const { GeneralProcessor } = require('./outputhandler/generalOutputProcessor')
const { predefinePrompt } = require('./Prompotlib')
const { model_parameters } = require('./agents/model_parameters')
const { logger } = require('./utils/logger')
const { getInputOrDefault } = require('./utils/inputFilter')
const fs = require('fs')
const path = require('path')
const { GenCVESync } = require('./tools/syft')

async function run() {
  const baseURL = getInputOrDefault('baseURL', '')
  logger.Info(`We are going to talk with Gen AI with URL ${baseURL}`)

  const apiKey = getInputOrDefault('apiKey', '')
  // creation of AI agent
  openAIfactory.setBaseURL(baseURL)
  openAIfactory.setKey(apiKey)
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
    deploymentfile,
    dryRun
  }
  // end of AI Agent creation
  const model = getInputOrDefault('model', '')
  logger.Info(`We are going to talk with Gen AI with Model ${model}`)
  const defualt_prompt = predefinePrompt(control_group)
  logger.Info(`default prompt ${defualt_prompt}`)

  model_parameters.init(model, defualt_prompt)
  GeneralProcessor.init(control_group)
  // once off tasks
  switch (control_group.runType) {
    case 'CVE2Deployment':
      GenCVESync()
      await cvss_deployment(openAIfactory, model_parameters, control_group)
      break
    case 'CVEDependency':
      GenCVESync()
      await CVEDependency(openAIfactory, model_parameters, control_group)
      break
    case 'CVEDeep':
      GenCVESync()
      await CVEDeep(openAIfactory, model_parameters, control_group)
      break
    default:
      await runAst(openAIfactory, model_parameters, control_group)
      break
  }
  GeneralProcessor.summary()
  // Log the current timestamp, wait, then log the new timestamp
  logger.Info(`complete at: ${new Date().toTimeString()}`)
}

//run()

module.exports = {
  run
}
