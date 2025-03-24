/* eslint-disable filenames/match-regex */
const {
  ProcessJsUnittest,
  ProcessGoDoc
} = require('./outputhandler/ouputprocessor')
const { taskQueue } = require('./orchestration')
const { logger } = require('./utils/logger')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function runAst(openAIfactory, model_parameters, control_group) {
  try {
    const dirPath = control_group.dirPath
    // for case loop AST
    // 1st level file reader
    // as AST scan result for your repo
    // define a json structure....
    logger.Info(`set dirPath as ${dirPath}`)
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
      openAIfactory,
      model_parameters,
      control_group
    )
    // output processor
    logger.Info('start processing GenAI result to file')
    logger.Info(`debug response from run AST as ${GenAIresponses.length}`)
    // General output to folder
    // Set Action output
    // specific processor action on source code
    if (control_group.runType === 'godoc' && !control_group.dryRun) {
      logger.Info('start process go doc')
      ProcessGoDoc(GenAIresponses)
    }
    if (control_group.runType === 'jsunittest' && !control_group.dryRun) {
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
