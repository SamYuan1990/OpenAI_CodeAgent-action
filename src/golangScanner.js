/* eslint-disable prefer-promise-reject-errors */
const { scanGolangCode } = require('./languageprocessor/golangAst')
const { logger } = require('./utils/logger')

/**
 * 扫描 Go 代码目录并构建数据结构队列
 * @param {string} dirPath - 要扫描的 Go 代码目录路径
 * @returns {Array} - 返回一个包含文件名、函数名和是否存在 Go Doc 的数据结构队列
 */
async function scanGoCodeDirectory(dirPath) {
  try {
    logger.Info('download go AST binary')
    //const download_log = await buildGoAST()
    //console.log(download_log)
    logger.Info('scan project', dirPath)
    const result = await scanGolangCode(dirPath)
    logger.Info(`scan result as ${result.length}`)
    return result
  } catch (error) {
    logger.Info('Error happen during build go AST', error)
  }
}

module.exports = {
  scanGoCodeDirectory
}
