const core = require('@actions/core')
const { writeFileForAarray } = require('./file_handler')

function processOutput(dataFromAIAgent, GenAItask) {
  const fileOverWrite = core.getInput('fileOverWrite', { required: true })
  if (GenAItask.outputProcessMethod === 'regex_match') {
    const regex = /```javascript([\s\S]*?)```([\r|\n]*?)###/g
    const matches = dataFromAIAgent.match(regex)
    if (matches) {
      const contents = matches.map(match =>
        match.replace(/```javascript|```([\r|\n]*?)###/g, '').trim()
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
  processOutput
}
