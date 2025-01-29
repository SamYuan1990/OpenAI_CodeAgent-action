const core = require('@actions/core')
const fs = require('fs')
const path = require('path')
const { processOutput } = require('./outputhandler/ouputprocessor')
const { invokeAIviaAgent } = require('./aiagent')
const { generateGenAItaskQueue } = require('./genaitask')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    // here receive the Tasks.json file.
    const tasksFilePath = path.join('Tasks.json')
    const tasksData = JSON.parse(fs.readFileSync(tasksFilePath, 'utf8'))

    // input validation for tasksData
    if (tasksData.length === 0) {
      core.info(`None task for process, return`)
      return
    }

    // here are the parameters for AI Agent
    const baseURL = core.getInput('baseURL', { required: true })
    const apiKey = core.getInput('apiKey', { required: true })
    const model = core.getInput('model', { required: true })

    for (const task of tasksData.tasks) {
      core.info(`start process task into GenAI task`, task.id)
      const GenAItaskQueue = await generateGenAItaskQueue(task)
      core.info(GenAItaskQueue.length, 'Gen AI task been found')
      for (let index = 0; index < GenAItaskQueue.length; index++) {
        core.debug(GenAItaskQueue[index].id)
        core.debug(GenAItaskQueue[index].prompt)
        core.debug(GenAItaskQueue[index].content)
        core.debug(GenAItaskQueue[index].outputFilePath)
        // input validation for AI agent
        if (apiKey === 'dummy') {
          core.info(`for test usage, continue`)
          core.debug(
            `${GenAItaskQueue[index].prompt}\n${GenAItaskQueue[index].content}`
          )
          continue
        }
        core.info(`start process task to GenAI,`, GenAItaskQueue[index].id)
        const dataFromAIAgent = await invokeAIviaAgent(
          baseURL,
          apiKey,
          GenAItaskQueue[index].content,
          GenAItaskQueue[index].prompt,
          model
        )
        core.info(`start process output from GenAI`)
        await processOutput(dataFromAIAgent, GenAItaskQueue[index])
        core.info(`Finish process task to GenAI`)
      }
      core.info(`finish process task`, task.id)
    }
    // Log the current timestamp, wait, then log the new timestamp
    core.debug('complete at:', new Date().toTimeString())
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
