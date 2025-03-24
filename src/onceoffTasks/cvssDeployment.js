const { fromCVEToPodDeployment } = require('./cve')
const { JustInvokeAI } = require('../aiagent')
const fs = require('fs')
const { logger } = require('../utils/logger')

async function cvss_deployment(openai, model_parameters, control_group) {
  const result = []
  logger.Info('running type CVE2Deployment')
  const cvss_content = await fromCVEToPodDeployment(control_group)
  const fileContent = fs.readFileSync(control_group.deploymentfile, 'utf8')
  //const content = `${cvss_content},${fileContent}`
  const content = {
    cvssscore: cvss_content,
    deployment: fileContent
  }
  const AIresponse = await JustInvokeAI(
    openai,
    model_parameters,
    control_group,
    content
  )
  if (!AIresponse.duplicate) {
    result.push(AIresponse.LLMresponse)
  }
  return result
}

module.exports = {
  cvss_deployment
}
