/* eslint-disable no-prototype-builtins */
/* eslint-disable github/array-foreach */
const { collectInformation } = require('../tools/cvetools')
const { logger } = require('../utils/logger')
const { JustInvokeAI } = require('../agents/aiagent')

async function CVEDependency(openAIfactory, model_parameters, control_group) {
  logger.Info(`start process CVE with dependency`)

  const information = await collectInformation(control_group)
  const result = []
  // in a for loop of information
  for (let i = 0; i < information.length; i++) {
    if (!information[i].hasOwnProperty('vulnerability')) {
      continue
    }
    // loop files
    // if need fix
    const AIresponse = await JustInvokeAI(
      openAIfactory,
      model_parameters,
      control_group,
      information[i]
    )
    // LLMresponse chain
    if (!AIresponse.duplicate) {
      result.push(AIresponse.LLMresponse)
    }
  }
  return result
}

module.exports = {
  CVEDependency
}
