const core = require('@actions/core')
const { writeFileForAarray } = require('./file_handler')

const js_regex = /```javascript([\s\S]*?)```([\r|\n]*?)###/g
const js_replacer = /```javascript|```([\r|\n]*?)###/g

const golang_regex = /```go([\s\S]*?)```([\r|\n]*?)###/g
const golang_replacer = /```go|```([\r|\n]*?)###/g

function ProcessJsUnittest(GenAIResult) {
  const my_regex = js_regex
  const my_replacer = js_replacer
  for (let index = 0; index < GenAIResult.length; index++) {
    const dataFromAIAgent = GenAIResult[index].GenAIContent
    const filePath =
      GenAIResult[index].currentPath.replace('src', '__test__') +
      GenAIResult[index].functionname +
      GenAIResult[index].filename.replace('.js', '.test.js')
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
  ProcessJsUnittest
}
