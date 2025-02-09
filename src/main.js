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
async function run(openai, model_parameters, runType, dryRun) {
  try {
    const dirPath = core.getInput('dirPath', { required: true })
    let maxIterations = 0
    maxIterations = core.getInput('maxIterations')
    // for case loop AST
    // 1st level file reader
    // as AST scan result for your repo
    // define a json structure....
    taskQueue.setmaxIterations(maxIterations)
    taskQueue.setdirPath(dirPath)
    if (runType === 'godoc') {
      taskQueue.GenerateGoDocTasks()
    }
    if (runType === 'jsunittest') {
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
    if (runType === 'godoc') {
      ProcessGoDoc(GenAIresponses)
    }
    if (runType === 'jsunittest') {
      ProcessJsUnittest(GenAIresponses)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
