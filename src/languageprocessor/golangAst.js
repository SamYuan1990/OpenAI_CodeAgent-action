/* eslint-disable jest/no-commented-out-tests */
/* eslint-disable prefer-promise-reject-errors */
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const logger = require('../logger/logger')

/**
 * 调用 Go 程序扫描 Golang 代码目录并生成 JSON 结果
 * @param {string} codeDir - Golang 代码目录路径
 * @returns {Promise<Object>} - 返回解析后的 JSON 结果
 */
function scanGolangCode(codeDir) {
  logger.Info(`start scanGolangCode`)
  return new Promise((resolve, reject) => {
    // 执行 Go 程序
    const command = `./goASTBin ${codeDir}`
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.Info(`${error.message}`)
        //reject(`执行 Go 程序失败: ${error.message}`)
        return
      }
      if (stderr) {
        logger.Info(`${error.message}`)
        //reject(`Go 程序输出错误: ${stderr}`)
        return
      }

      // 读取生成的 JSON 文件
      const jsonFilePath = path.join(codeDir, 'golangAST.json')
      fs.readFile(jsonFilePath, 'utf-8', (err, data) => {
        if (err) {
          logger.Info(`fail to read json file ${err}`)
          //reject(`读取 JSON 文件失败: ${err.message}`)
          return
        }

        // 解析 JSON 数据
        try {
          const jsonResult = JSON.parse(data)
          resolve(jsonResult)
        } catch (parseError) {
          logger.Info(`fail to parse data to JSON, data: ${data}`)
          logger.Info(`fail to parse JSON: ${parseError}`)
          //reject(`解析 JSON 数据失败: ${parseError.message}`)
        }
      })
    })
  })
}

module.exports = {
  scanGolangCode
}

// 示例调用
/*async function test() {
  try {
    const codeDir = '/Users/yuanyi/OpenSource/kubeedge/pkg' // 替换为你的 Golang 代码目录
    const result = await scanGolangCode(codeDir)
    console.log('扫描结果:', result)
  } catch (error) {
    console.error('发生错误:', error)
  }
}
test()*/
