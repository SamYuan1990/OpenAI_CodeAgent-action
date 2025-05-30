const fs = require('fs')
const { logger } = require('../utils/logger')

function writeFileForAarray(filePath, content) {
  const WriteContent = content.join()
  logger.Debug(WriteContent)
  try {
    fs.writeFileSync(filePath, WriteContent, 'utf8')
    logger.Info('file writed')
  } catch (err) {
    logger.Info(`file write error: ${err.message}`)
  }
}

module.exports = {
  writeFileForAarray
}
