const { fromCVEToPodDeployment } = require('./cve')
const { preparePrompt, invokeAIviaAgent } = require('../aiagent')
const fs = require('fs')
const { logger } = require('../utils/logger')

async function cvss_deployment(
  openai,
  model_parameters,
  control_group,
  dryRun
) {
  const result = []
  logger.Info('running type CVE2Deployment')
  const cvss_content = await fromCVEToPodDeployment(control_group)
  const fileContent = fs.readFileSync(control_group.deploymentfile, 'utf8')
  //const content = `${cvss_content},${fileContent}`
  const content = {
    cvssscore: cvss_content,
    deployment: fileContent
  }
  const promptContent = preparePrompt(
    model_parameters.prompt,
    content,
    control_group
  )
  // check if hash in genai output
  if (fs.existsSync(promptContent.filePath)) {
    logger.Info('output file exisit, skip')
    return result
  }
  // if there skip
  const LLMresponse = await invokeAIviaAgent(
    openai,
    model_parameters.model,
    dryRun,
    promptContent
  )
  result.push(LLMresponse)
  return result
}

module.exports = {
  cvss_deployment
}
