const core = require('@actions/core')
const fs = require('fs')

function writeFileForAarray(filePath, content) {
  const WriteContent = content.join()
  core.debug(WriteContent)
  try {
    fs.writeFileSync(filePath, WriteContent, 'utf8')
    core.info('file writed')
  } catch (err) {
    core.info(`file write error: ${err.message}`)
  }
}

module.exports = {
  writeFileForAarray
}
