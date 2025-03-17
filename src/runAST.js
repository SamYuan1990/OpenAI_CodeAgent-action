/* eslint-disable filenames/match-regex */
const core = require('@actions/core')
const {
  ProcessJsUnittest,
  ProcessGoDoc
} = require('./outputhandler/ouputprocessor')
const { taskQueue } = require('./orchestration')
const { logger } = require('./utils/logger')
const { getInputOrDefault } = require('./utils/inputFilter')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function runAst(openai, model_parameters, control_group, dryRun) {
  try {
    const dirPath = getInputOrDefault('dirPath', '')
    // for case loop AST
    // 1st level file reader
    // as AST scan result for your repo
    // define a json structure....
    logger.Info(`dirPath ${dirPath}`)
    taskQueue.setmaxIterations(control_group.maxIterations)
    taskQueue.setdirPath(dirPath)
    if (control_group.runType === 'godoc') {
      await taskQueue.GenerateGoDocTasks()
    }
    if (control_group.runType === 'jsunittest') {
      taskQueue.GenerateJsUnitTestTask()
    }
    if (control_group.runType === 'ccodescan') {
      taskQueue.InitCCodeRepo()
    }
    // loop AST tasks
    const GenAIresponses = await taskQueue.run(
      openai,
      model_parameters.model,
      model_parameters.prompt,
      control_group,
      dryRun
    )
    // output processor
    logger.Info('start processing GenAI result to file')
    logger.Info(`debug response from run AST as ${GenAIresponses.length}`)
    // General output to folder
    // Set Action output
    // specific processor action on source code
    if (control_group.runType === 'godoc' && !dryRun) {
      logger.Info('start process go doc')
      ProcessGoDoc(GenAIresponses)
    }
    if (control_group.runType === 'jsunittest' && !dryRun) {
      ProcessJsUnittest(dirPath, GenAIresponses)
    }
    return GenAIresponses
  } catch (error) {
    // Fail the workflow run if an error occurs
    logger.Info(error.message)
  }
}

module.exports = {
  runAst
}
