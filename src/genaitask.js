const core = require('@actions/core')
const fs = require('fs')
const {
  parseFileToAST,
  extractAllFunctions
} = require('./languageprocessor/inputprocessor')
const {
  extractGolangFunctions
} = require('./languageprocessor/golangprocessor')

async function generateGenAItaskQueue(task) {
  const GenAITaskQueue = []
  core.info(task.id)
  core.info(task.inputFilePath)
  core.info(task.outputProcessMethod)
  core.info(task.prompt)
  core.info(task.inputFileProcessMethod)
  if (task.inputFileProcessMethod === 'by_function') {
    let funcsfound = []
    let code_language = 'js'
    switch (true) {
      case task.inputFilePath.includes('_test.go'):
        funcsfound = await extractGolangFunctions(task.inputFilePath, true)
        code_language = 'go'
        break
      case task.inputFilePath.includes('.go'):
        funcsfound = await extractGolangFunctions(task.inputFilePath)
        code_language = 'go'
        break
      default:
        // eslint-disable-next-line no-case-declarations
        const code = fs.readFileSync(task.inputFilePath, 'utf8')
        // eslint-disable-next-line no-case-declarations
        const ast = parseFileToAST(task.inputFilePath)
        funcsfound = extractAllFunctions(ast, code)
        break
    }

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
      tempTask.code_language = code_language
      core.debug(tempTask.outputFilePath)
      GenAITaskQueue.push(tempTask)
    }
  }
  return GenAITaskQueue
}

module.exports = {
  generateGenAItaskQueue
}
