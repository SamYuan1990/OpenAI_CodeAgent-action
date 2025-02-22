const { writeFileForAarray } = require('./file_handler')
const {
  extractFunctionComment,
  insertCommentAboveFunction
} = require('./goDoc')
const { logger } = require('../utils/logger')

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
    const filePath = `./${GenAIResult[index].meta.filename}`
    logger.Info(`going to process function ${funcName}`)
    logger.Info(`going to process at file ${filePath}`)
    logger.Info(`going to process genAI content ${dataFromAIAgent}`)
    if (funcName === 'undefined') {
      logger.Info('skip anonymous function')
      continue
    }
    if (matches) {
      logger.Info('match regex fileter, processing')
      const code_contents = matches.map(match =>
        match.replace(my_replacer, '').trim()
      )
      logger.Info(`match regex fileter, processing${code_contents}`)
      // step 2, get comments from contents
      const content = extractFunctionComment(code_contents, funcName)
      logger.Info(`going to insert comments as ${content}`)
      // step 3, write comments into file
      const comments = ['Comments below is assisted by Gen AI', content]
      insertCommentAboveFunction(filePath, funcName, comments)
      logger.Info('complete insert comments')
    }
  }
}

function ProcessJsUnittest(GenAIResult) {
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

/*function processOutput(dataFromAIAgent, GenAItask) {
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
      writeFileForAarray(GenAItask.outputFilePath, contents)
      core.debug('content:', contents)
    } else {
      core.info('content not found')
    }
  }
}*/

module.exports = {
  ProcessJsUnittest,
  ProcessGoDoc
}
