/* eslint-disable filenames/match-regex */
const fs = require('fs')
const path = require('path')
const { logger } = require('../utils/logger')
const { context, getOctokit } = require('@actions/github')
const { getInputOrDefault } = require('../utils/inputFilter')

const GeneralProcessor = {
  input_token: 0,
  output_token: 0,
  time_usage: 0,
  processed_task: 0,
  prompt_precent: 0,
  content_precent: 0,
  control_group: null,
  isoDate: new Date().toISOString().substring(0, 10),
  octokit: null,

  init(control_group) {
    this.control_group = control_group
    if (this.control_group.githubIssueReport && !this.control_group.dryRun) {
      logger.Info(`prepare for create github issue with token`)
      const token = getInputOrDefault('token', '')
      this.octokit = getOctokit(token)
    }
  },

  async process(LLMresponse) {
    logger.Info(`process general output for ${LLMresponse.hashValue}`)
    logger.Info(`collected prompt_precent for ${LLMresponse.prompt_precent}`)
    this.prompt_precent += LLMresponse.prompt_precent
    logger.Info(`collected content_precent for ${LLMresponse.content_precent}`)
    this.content_precent += LLMresponse.content_precent
    logger.Info(`collected time_usage for ${LLMresponse.time_usage}`)
    this.time_usage += LLMresponse.time_usage
    logger.Info(`collected inputToken for ${LLMresponse.inputToken}`)
    this.input_token += LLMresponse.inputToken
    logger.Info(`collected outputToken for ${LLMresponse.outputToken}`)
    this.output_token += LLMresponse.outputToken
    this.processed_task++
    logger.Info(`completed with task information collection`)
    const jsonString = JSON.stringify(LLMresponse, null, 2)
    const filePath = LLMresponse.filePath
    fs.writeFileSync(filePath, jsonString)
    logger.Info(`Record data to file ${filePath} success`)
    if (this.control_group.githubIssueReport) {
      // const + intention + date + hash
      const title = `OpenAI_CodeAgent created task [${this.control_group.runType},${this.isoDate},${LLMresponse.hashValue.substring(0, 7)}]`
      logger.Info(`New issue title going to be: ${title}`)
      if (
        !this.control_group.dryRun &&
        LLMresponse.response.trim().length > 0
      ) {
        await createGithubIssueAccordingly(LLMresponse, this.octokit, title)
      }
    }
    logger.Info(`process complete for ${LLMresponse.hashValue}`)
  },

  summary() {
    logger.Info(`start summry for ${this.processed_task} tasks`)
    const avg_prompt_precent = this.prompt_precent / this.processed_task
    logger.Info(`avg_prompt_precent ${avg_prompt_precent}`)
    const avg_content_precent = this.content_precent / this.processed_task
    logger.Info(`avg_content_precent ${avg_content_precent}`)
    const avg_time_usage = this.time_usage / this.processed_task
    logger.Info(`avg_time_usage ${avg_time_usage}`)
    const avg_inputToken = this.input_token / this.processed_task
    logger.Info(`avg_inputToken ${avg_inputToken}`)
    const avg_outputToken = this.output_token / this.processed_task
    logger.Info(`avg_outputToken ${avg_outputToken}`)
    // Set Action output
    const Output = {
      avg_prompt_precent,
      avg_content_precent,
      avg_inputToken,
      avg_outputToken,
      avg_time_usage
    }
    const folderName = this.control_group.folderName
    const filePath = path.join(folderName, `summary.json`)
    const summary_jsonString = JSON.stringify(Output, null, 2)
    fs.writeFileSync(filePath, summary_jsonString)
  }
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
  GeneralProcessor
}
