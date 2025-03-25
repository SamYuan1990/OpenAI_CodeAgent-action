/* eslint-disable no-prototype-builtins */
/* eslint-disable github/array-foreach */
const { collectInformation } = require('../tools/cvetools')
const { logger } = require('../utils/logger')
const { JustInvokeAI } = require('../agents/aiagent')
const fs = require('fs')

async function CVEDeep(openAIfactory, model_parameters, control_group) {
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
    // for loop on information.file
    // get file content
    for (let j = 0; j < information[i].files; j++) {
      // information.package + information.desc + file content -> content
      const filecontent = fs.readFileSync(information[i].files[j])
      const content = {
        packagename: information[i].dependencyName,
        filecontent,
        vulnerability: information[i].vulnerability
      }
      const AIresponse = await JustInvokeAI(
        openAIfactory,
        model_parameters,
        control_group,
        content
      )
      // LLMresponse chain
      if (!AIresponse.duplicate) {
        result.push(AIresponse.LLMresponse)
      }
    }
  }
  return result
}

module.exports = {
  CVEDeep
}
