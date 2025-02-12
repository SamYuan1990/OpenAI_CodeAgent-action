const core = require('@actions/core')
const { writeFileForAarray } = require('./file_handler')
const {
  extractFunctionComment,
  insertCommentAboveFunction
} = require('./goDoc')

const js_regex = /```javascript([\s\S]*?)```([\r|\n]*?)###/g
const js_replacer = /```javascript|```([\r|\n]*?)###/g

const golang_regex = /```go([\s\S]*?)```([\r|\n]*?)###/g
const golang_replacer = /```go|```([\r|\n]*?)###/g

function ProcessGoDoc(GenAIResult) {
  // step 1, get go code block from input
  const my_regex = golang_regex
  const my_replacer = golang_replacer
  for (let index = 0; index < GenAIResult.length; index++) {
    const dataFromAIAgent = GenAIResult[index].response
    const matches = dataFromAIAgent.match(my_regex)
    const funcName = GenAIResult[index].meta.functionname
    const filePath = `${GenAIResult[index].meta.currentPath}/${GenAIResult[index].meta.filename}`
    core.info(`going to process function ${funcName}`)
    core.info(`going to process at file ${filePath}`)
    core.info(`going to process genAI content ${dataFromAIAgent}`)
    if (funcName === 'undefined') {
      core.info('skip anonymous function')
      continue
    }
    if (matches) {
      const code_contents = matches.map(match =>
        match.replace(my_replacer, '').trim()
      )
      // step 2, get comments from contents
      const content = extractFunctionComment(code_contents, funcName)
      // step 3, write comments into file
      const comments = ['Comments below is assisted by Gen AI', content]
      insertCommentAboveFunction(filePath, funcName, comments)
    }
  }
}

function ProcessJsUnittest(path, GenAIResult) {
  const my_regex = js_regex
  const my_replacer = js_replacer
  for (let index = 0; index < GenAIResult.length; index++) {
    const dataFromAIAgent = GenAIResult[index].response
    const filePath = `./__tests__/${GenAIResult[index].hashValue}.test.js`
    const matches = dataFromAIAgent.match(my_regex)
    if (matches) {
      const contents = matches.map(match =>
        match.replace(my_replacer, '').trim()
      )
      writeFileForAarray(filePath, contents)
    }
  }
}

function processOutput(dataFromAIAgent, GenAItask) {
  const fileOverWrite = core.getInput('fileOverWrite', { required: true })
  let my_regex = js_regex
  let my_replacer = js_replacer
  if (GenAItask.code_language === 'go') {
    my_regex = golang_regex
    my_replacer = golang_replacer
  }
  if (GenAItask.outputProcessMethod === 'regex_match') {
    const matches = dataFromAIAgent.match(my_regex)
    if (matches) {
      const contents = matches.map(match =>
        match.replace(my_replacer, '').trim()
      )
      if (fileOverWrite === 'true') {
        writeFileForAarray(GenAItask.outputFilePath, contents)
      } else {
        core.info(contents)
      }
      core.debug('content:', contents)
    } else {
      core.info('content not found')
    }
  }
}

module.exports = {
  processOutput,
  ProcessJsUnittest,
  ProcessGoDoc
}
