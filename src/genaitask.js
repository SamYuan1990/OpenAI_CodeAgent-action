const core = require('@actions/core')
const fs = require('fs')
const { parseFileToAST, extractAllFunctions } = require('./inputprocessor')

async function generateGenAItaskQueue(task) {
  const GenAITaskQueue = []
  core.info(task.id)
  core.info(task.inputFilePath)
  core.info(task.outputProcessMethod)
  core.info(task.prompt)
  core.info(task.inputFileProcessMethod)
  if (task.inputFileProcessMethod === 'by_function') {
    const code = fs.readFileSync(task.inputFilePath, 'utf8')
    const ast = parseFileToAST(task.inputFilePath)
    const funcsfound = extractAllFunctions(ast, code)
    for (let index = 0; index < funcsfound.length; index++) {
      const tempTask = {}
      const func = funcsfound[index]
      core.debug(`Function ${index}:`)
      core.debug(`Name: ${func.name}`)
      core.debug(`Content:\n${func.content}\n`)
      tempTask.id = task.id + index
      tempTask.prompt = task.prompt
      tempTask.content = func.content
      tempTask.outputProcessMethod = task.outputProcessMethod
      tempTask.outputFilePath = task.outputFilePath.replace('{{index}}', index)
      core.debug(tempTask.outputFilePath)
      GenAITaskQueue.push(tempTask)
    }
  }
  return GenAITaskQueue
}

module.exports = {
  generateGenAItaskQueue
}
