const { fromCVEToPodDeployment } = require('./cve')
const { invokeAIviaAgent } = require('../aiagent')
const fs = require('fs')
const { getInputOrDefault } = require('../utils/inputFilter')
const { logger } = require('../utils/logger')

async function cvss_deployment(openai, model_parameters, dryRun) {
  const result = []
  logger.Info('running type CVE2Deployment')
  const deploymentfile = getInputOrDefault('deploymentfile', '')
  const cvss_content = await fromCVEToPodDeployment()
  const fileContent = fs.readFileSync(deploymentfile, 'utf8')
  const content = `${cvss_content},${fileContent}`
  const LLMresponse = await invokeAIviaAgent(
    openai,
    model_parameters.model,
    model_parameters.prompt,
    dryRun,
    content
  )
  result.push(LLMresponse)
  return result
}

module.exports = {
  cvss_deployment
}
