/* eslint-disable filenames/match-regex */
const core = require('@actions/core')
const fs = require('fs')
const path = require('path')

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
  const folderName = './GenAI_output'

  fs.mkdirSync(folderName)
  // General output to folder
  let prompt_precent_sum = 0
  let content_precent_sum = 0
  for (let i = 0; i < LLMresponses.length; i++) {
    prompt_precent_sum += LLMresponses[i].prompt_precent
    content_precent_sum += LLMresponses[i].content_precent
    const jsonString = JSON.stringify(LLMresponses[i], null, 2)
    const filePath = path.join(
      __dirname,
      folderName,
      `file_${LLMresponses[i].hashValue}.out`
    )
    fs.writeFileSync(filePath, jsonString)
    core.info(`Record data to file ${filePath} success`)
  }

  const avg_prompt_precent = prompt_precent_sum / LLMresponses.length
  const avg_content_precent = content_precent_sum / LLMresponses.length
  // Set Action output
  core.setOutput('avg_prompt_precent', avg_prompt_precent)
  core.setOutput('avg_content_precent', avg_content_precent)
  if (LLMresponses.length === 0) {
    core.info(LLMresponses[0])
    core.setOutput('LLMresponse', LLMresponses[0].response)
    core.setOutput('final_prompt', LLMresponses[0].final_prompt)
  }
}

module.exports = {
  processOutput
}
