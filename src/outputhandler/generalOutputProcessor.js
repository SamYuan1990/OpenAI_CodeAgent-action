/* eslint-disable filenames/match-regex */
const fs = require('fs')
const path = require('path')
const { logger } = require('../utils/logger')
const { context, getOctokit } = require('@actions/github')
const { getInputOrDefault } = require('../utils/inputFilter')

async function processOutput(LLMresponses, control_group) {
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
  const folderName = control_group.folderName
  const outputpath = fs.mkdirSync(folderName, {
    recursive: true,
    permission: 0o755
  })
  if (outputpath != null) {
    const absolutePath = path.resolve(outputpath)
    logger.Info(`make output dir, ${absolutePath}`)
  }
  const isoDate = new Date().toISOString()
  // General output to folder
  let prompt_precent_sum = 0
  let content_precent_sum = 0
  let total_time = 0
  let total_input_token = 0
  let total_output_token = 0
  logger.Info(`going to process ${LLMresponses.length} results`)

  let octokit
  if (control_group.githubIssueReport && !control_group.dryRun) {
    logger.Info(`prepare for create github issue with token`)
    const token = getInputOrDefault('token', '')
    octokit = getOctokit(token)
  }

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
    // issue support for each
    // todo if we need handle response const { newIssueNumber, newIssueId, newIssueNodeId }
    // handle token from github action by default
    if (control_group.githubIssueReport) {
      // const + intention + date + hash
      const title = `OpenAI_CodeAgent created task [${control_group.runType},${isoDate},${LLMresponses[i].hashValue.substring(0, 7)}]`
      logger.Info(`New issue title going to be: ${title}`)
      if (!control_group.dryRun && LLMresponses[i].response.trim().length > 0) {
        await createGithubIssueAccordingly(LLMresponses[i], octokit, title)
      }
    }
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

async function createGithubIssueAccordingly(LLMresponses, octokit, title) {
  const {
    data: { number: newIssueNumber, id: newIssueId, node_id: newIssueNodeId }
  } =
    (await octokit.rest.issues.create({
      ...context.repo,
      title,
      body: LLMresponses.response
    })) || {}
  logger.Info(`New issue number: ${newIssueNumber}`)
  logger.Info(`New issue id: ${newIssueId}`)
  logger.Info(`New issue node ID: ${newIssueNodeId}`)

  return {
    newIssueNumber: Number(newIssueNumber),
    newIssueId,
    newIssueNodeId
  }
}

module.exports = {
  processOutput
}
