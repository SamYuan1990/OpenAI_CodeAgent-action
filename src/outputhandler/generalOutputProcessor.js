/* eslint-disable filenames/match-regex */
const fs = require('fs')
const path = require('path')
const { logger } = require('../utils/logger')
const { getInputOrDefault } = require('../utils/inputFilter')

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
    final_prompt: '',
    input_token: 0,
    output_token: 0,
    avg_time_usage: 0
  }
  const folderName = getInputOrDefault('output_path', '/workdir/GenAI_output')
  const outputpath = fs.mkdirSync(folderName, {
    recursive: true,
    permission: 0o755
  })
  if (outputpath != null) {
    const absolutePath = path.resolve(outputpath)
    logger.Info(`make output dir, ${absolutePath}`)
  }
  // General output to folder
  let prompt_precent_sum = 0
  let content_precent_sum = 0
  let total_time = 0
  let total_input_token = 0
  let total_output_token = 0
  logger.Info(`going to process ${LLMresponses.length} results`)
  for (let i = 0; i < LLMresponses.length; i++) {
    logger.Info(`process general output for ${LLMresponses[i].hashValue}`)
    prompt_precent_sum += LLMresponses[i].prompt_precent
    content_precent_sum += LLMresponses[i].content_precent
    total_time += LLMresponses[i].time_usage
    total_input_token += LLMresponses[i].inputToken
    total_output_token += LLMresponses[i].outputToken
    const jsonString = JSON.stringify(LLMresponses[i], null, 2)
    const filePath = path.join(
      folderName,
      `file_${LLMresponses[i].hashValue}.out`
    )
    fs.writeFileSync(filePath, jsonString)
    logger.Info(`Record data to file ${filePath} success`)
    logger.Info(`process complete for ${LLMresponses[i].hashValue}`)
  }

  const avg_prompt_precent = prompt_precent_sum / LLMresponses.length
  const avg_content_precent = content_precent_sum / LLMresponses.length
  const avg_time_usage = total_time / LLMresponses.length
  const avg_inputToken = total_input_token / LLMresponses.length
  const avg_outputToken = total_output_token / LLMresponses.length
  // Set Action output
  logger.Info(`avg_prompt_precent ${avg_prompt_precent}`)
  Output.avg_prompt_precent = avg_prompt_precent
  logger.Info(`avg_content_precent ${avg_content_precent}`)
  Output.avg_content_precent = avg_content_precent
  logger.Info(`avg_time_usage ${avg_time_usage}`)
  Output.avg_time_usage = avg_time_usage
  logger.Info(`avg_inputToken ${avg_inputToken}`)
  Output.avg_inputToken = avg_inputToken
  logger.Info(`avg_outputToken ${avg_outputToken}`)
  Output.avg_outputToken = avg_outputToken
  if (LLMresponses.length === 1) {
    logger.Info(LLMresponses[0])
    Output.LLMresponse = LLMresponses[0].response
    Output.final_prompt = LLMresponses[0].final_prompt
  }
  const filePath = path.join(folderName, `summary.json`)
  const summary_jsonString = JSON.stringify(Output, null, 2)
  fs.writeFileSync(filePath, summary_jsonString)
}

module.exports = {
  processOutput
}
