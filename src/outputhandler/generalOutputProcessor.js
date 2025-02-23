/* eslint-disable filenames/match-regex */
const core = require('@actions/core')
const fs = require('fs')
const path = require('path')
const { logger } = require('../utils/logger')

function processOutput(LLMresponses) {
  // output processor
  // Array of
  // const prompt_info = {
  // model,
  // final_prompt, > file content
  // hashValue, > file name
  // response, > file content
  // prompt_precent, > file content, avg output
  // content_precent > file content, avg output
  // }
  const Output = {
    avg_prompt_precent: 0,
    avg_content_precent: 0,
    LLMresponse: '',
    final_prompt: ''
  }
  const folderName = './GenAI_output'
  const outputpath = fs.mkdirSync(folderName, {
    recursive: true,
    permission: 0o755
  })
  const absolutePath = path.resolve(outputpath)
  logger.Info(`make output dir, ${absolutePath}`)
  // General output to folder
  let prompt_precent_sum = 0
  let content_precent_sum = 0
  logger.Info(`going to process ${LLMresponses.length} results`)
  for (let i = 0; i < LLMresponses.length; i++) {
    logger.Info('process general output for ', LLMresponses[i].hashValue)
    prompt_precent_sum += LLMresponses[i].prompt_precent
    content_precent_sum += LLMresponses[i].content_precent
    const jsonString = JSON.stringify(LLMresponses[i], null, 2)
    const filePath = path.join(
      folderName,
      `file_${LLMresponses[i].hashValue}.out`
    )
    fs.writeFileSync(filePath, jsonString)
    logger.Info(`Record data to file ${filePath} success`)
    logger.Info('process complete for ', LLMresponses[i].hashValue)
  }

  const avg_prompt_precent = prompt_precent_sum / LLMresponses.length
  const avg_content_precent = content_precent_sum / LLMresponses.length
  // Set Action output
  logger.Info('avg_prompt_precent', avg_prompt_precent)
  Output.avg_prompt_precent = avg_prompt_precent
  logger.Info('avg_content_precent', avg_content_precent)
  Output.avg_content_precent = avg_content_precent
  if (LLMresponses.length === 1) {
    logger.Info(LLMresponses[0])
    Output.LLMresponse = LLMresponses[0].response
    Output.final_prompt = LLMresponses[0].final_prompts
  }
  const filePath = path.join(folderName, `summary.json`)
  const summary_jsonString = JSON.stringify(Output, null, 2)
  fs.writeFileSync(filePath, summary_jsonString)
}

module.exports = {
  processOutput
}
