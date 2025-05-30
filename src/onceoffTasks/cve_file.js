/* eslint-disable no-prototype-builtins */
/* eslint-disable github/array-foreach */
const { collectInformation } = require('../tools/cvetools')
const { logger } = require('../utils/logger')
const { JustInvokeAI } = require('../agents/aiagent')
const fs = require('fs')
const { GenCVESync } = require('../tools/syft')
const async = require('async')
const { callbackify } = require('util')

async function CVEDeep(openAIfactory, model_parameters, control_group) {
  logger.Info(`start process CVEDeep`)
  GenCVESync()

  const information = await collectInformation(control_group)
  // in a for loop of information
  //for (let i = 0; i < information.length; i++) {
  //  process_CVE_information(openAIfactory, model_parameters, information[i])
  //}
  async.map(
    information,
    async (item, callback) => {
      await process_CVE_information(
        openAIfactory,
        model_parameters,
        control_group,
        item,
        (err, result) => {
          callback(err, result)
        }
      )
    },
    (err, results) => {
      if (err) {
        console.error('处理过程中出错:', err)
      } else {
        console.log('所有项目处理完成，结果:', results)
      }
    }
  )
}

async function process_CVE_information(
  openAIfactory,
  model_parameters,
  control_group,
  information
) {
  if (!information.hasOwnProperty('vulnerability')) {
    return
  }
  // loop files
  // if need fix
  // for loop on information.file
  // get file content
  logger.Info(`package name ${information.dependencyName}`)
  logger.Info(`going to process ${information.files.length}`)
  const files_list = information.files
  for (let j = 0; j < files_list.length; j++) {
    model_parameters.restPrompt()
    // information.package + information.desc + file content -> content
    logger.Info(`start process file ${files_list[j]}`)
    const filecontent = fs.readFileSync(files_list[j], 'utf8')
    logger.Debug(`${filecontent}`)
    const content = {
      packagename: information.dependencyName,
      filecontent,
      vulnerability: information.vulnerability
    }
    const AIresponse = await JustInvokeAI(
      openAIfactory,
      model_parameters,
      control_group,
      content
    )
    // LLMresponse chain
    const check_result = extractAnswers(AIresponse.LLMresponse.response)
    if (check_result.success) {
      if (check_result.match[1] === 'Yes' || check_result.match[2] === 'Yes') {
        logger.Info(`Generate CVE reports`)
        model_parameters.nextPrompt()
        const report = await JustInvokeAI(
          openAIfactory,
          model_parameters,
          control_group,
          information
        )
        fs.writeFileSync(
          `${control_group.folderName}/${information.vulnerability.id}_report.md`,
          report.LLMresponse.response
        )
        fs.writeFileSync(
          `${control_group.folderName}/${information.vulnerability.id}_reason.md`,
          AIresponse.LLMresponse.response
        )
        fs.writeFileSync(
          `${control_group.folderName}/${information.vulnerability.id}_reason_ask.md`,
          AIresponse.LLMresponse.final_prompt
        )
        break
        // LLMresponse chain
        // todo safe response to pdf
      }
    }
  }
}

function extractAnswers(text) {
  // 单个正则表达式同时匹配两个问题的回答
  const regex =
    /(?:Is the related function invoked\?|Related function invoked\?)[\s\S]*?\b(Yes|No)\b[\s\S]*?(?:Does the CVE affect the code\?|CVE affects the code\?)[\s\S]*?\b(Yes|No)\b/gi

  const match = regex.exec(text)

  if (match && match.length >= 3) {
    return { success: true, match }
  }

  return { success: false, match }
}

module.exports = {
  CVEDeep
}
