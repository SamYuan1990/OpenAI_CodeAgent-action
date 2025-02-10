const core = require('@actions/core')
const { fromCVEToPodDeployment } = require('./cve')
const { invokeAIviaAgent } = require('./aiagent')
const fs = require('fs')

async function cvss_deployment(openai, model_parameters, dryRun) {
  core.info('running type CVE2Deployment')
  const deploymentfile = core.getInput('deploymentfile', { required: true })
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
  return [LLMresponse]
}

module.exports = {
  cvss_deployment
}
