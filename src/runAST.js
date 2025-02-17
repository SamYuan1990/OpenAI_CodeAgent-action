/* eslint-disable filenames/match-regex */
const core = require('@actions/core')
const {
  ProcessJsUnittest,
  ProcessGoDoc
} = require('./outputhandler/ouputprocessor')
const { taskQueue } = require('./orchestration')
/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function runAst(openai, model_parameters, control_group, dryRun) {
  try {
    const dirPath = core.getInput('dirPath', { required: true })
    // for case loop AST
    // 1st level file reader
    // as AST scan result for your repo
    // define a json structure....
    core.info(`dirPath ${dirPath}`)
    taskQueue.setmaxIterations(control_group.maxIterations)
    taskQueue.setdirPath(dirPath)
    if (control_group.runType === 'godoc') {
      await taskQueue.GenerateGoDocTasks()
    }
    if (control_group.runType === 'jsunittest') {
      taskQueue.GenerateJsUnitTestTask()
    }
    // loop AST tasks
    const GenAIresponses = await taskQueue.run(
      openai,
      model_parameters.model,
      model_parameters.prompt,
      dryRun
    )
    // output processor
    core.info('start processing GenAI result to file')
    // General output to folder
    // Set Action output
    // specific processor action on source code
    if (control_group.runType === 'godoc') {
      core.info('start process go doc')
      ProcessGoDoc(GenAIresponses)
    }
    if (control_group.runType === 'jsunittest') {
      ProcessJsUnittest(dirPath, GenAIresponses)
    }
    core.info(`debug ${GenAIresponses.length}`)
    return GenAIresponses
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.error(error.message)
  }
}

module.exports = {
  runAst
}
