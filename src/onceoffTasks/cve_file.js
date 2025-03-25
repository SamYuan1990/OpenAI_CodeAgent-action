/* eslint-disable no-prototype-builtins */
/* eslint-disable github/array-foreach */
const { collectInformation } = require('../tools/cvetools')
const { logger } = require('../utils/logger')
const { JustInvokeAI } = require('../agents/aiagent')
const fs = require('fs')

async function CVEDeep(openAIfactory, model_parameters, control_group) {
  logger.Info(`start process CVEDeep`)

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
    logger.Info(`package name ${information[i].dependencyName}`)
    logger.Info(`going to process ${information[i].files.length}`)
    const files_list = information[i].files
    if (files_list.length > 0) {
      logger.Info(files_list[0])
    }
    for (let j = 0; j < files_list; j++) {
      logger.Info(files_list[j])
    }
    for (let j = 0; j < files_list; j++) {
      // information.package + information.desc + file content -> content
      logger.Info(`start process file ${files_list[j]}`)
      const filecontent = fs.readFileSync(files_list[j])
      logger.Info(`${filecontent}`)
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
