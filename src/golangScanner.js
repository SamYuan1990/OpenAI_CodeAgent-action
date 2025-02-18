/* eslint-disable prefer-promise-reject-errors */
const core = require('@actions/core')
const { scanGolangCode } = require('./languageprocessor/golangAst')
const { exec } = require('child_process')

/**
 * 扫描 Go 代码目录并构建数据结构队列
 * @param {string} dirPath - 要扫描的 Go 代码目录路径
 * @returns {Array} - 返回一个包含文件名、函数名和是否存在 Go Doc 的数据结构队列
 */
async function scanGoCodeDirectory(dirPath) {
  try {
    console.log('build go AST')
    const download_log = await buildGoAST()
    console.log(download_log)
    console.log('scan project', dirPath)
    const result = await scanGolangCode(dirPath)
    console.log(`scan result as ${result.length}`)
    return result
  } catch (error) {
    core.error('Error happen during build go AST', error)
  }
}

/**
 * 构建 Go 项目并将结果输出到指定目录
 * @param {string} projectDir - Go 项目的相对目录
 * @param {string} outputDir - 构建结果的输出目录
 * @returns {Promise<string>} - 返回构建结果的标准输出
 */
function buildGoAST() {
  return new Promise((resolve, reject) => {
    // 解析相对路径为绝对路径
    // 构建 Go 项目的命令
    const command = `wget https://github.com/SamYuan1990/OpenAI_CodeAgent-action/blob/main/goASTBin -O ./goASTBin && chmod a+x goASTBin`

    // 执行命令
    exec(command, (error, stdout, stderr) => {
      if (error) {
        core.error(`fail to build Go project: ${error.message}`)
        reject(`构建 Go 项目失败: ${error.message}`)
        return
      }
      if (stderr) {
        core.error(`fail to build Go output: ${error.message}`)
        reject(`构建 Go 项目输出错误: ${stderr}`)
        return
      }

      // 返回标准输出
      resolve(stdout)
    })
  })
}

module.exports = {
  scanGoCodeDirectory
}
