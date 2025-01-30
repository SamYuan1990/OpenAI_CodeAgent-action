/* eslint-disable prettier/prettier */
const core = require('@actions/core')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const {
  parseFileToAST,
  extractAllFunctions
} = require('./languageprocessor/inputprocessor')

/**
 * 扫描 Go 代码目录并构建数据结构队列
 * @param {string} dirPath - 要扫描的 Go 代码目录路径
 * @returns {Array} - 返回一个包含文件名、函数名和是否存在 Go Doc 的数据结构队列
 */
function scanJSCodeDirectory(dirPath) {
  const resultQueue = [] // 结果队列
  console.log('complete run unit test')

  runUnitTest()
  console.log('complete run unit test')
  const testUnCoverFiles = findUncoveredFiles('./testresult.out')

  // 递归遍历目录
  function traverseJSDirectory(currentPath) {
    const items = fs.readdirSync(currentPath, { withFileTypes: true })

    for (const item of items) {
      const itemPath = path.join(currentPath, item.name)

      if (item.isDirectory()) {
        // 如果是目录，递归遍历
        traverseJSDirectory(itemPath)
      } else if (item.isFile() && item.name.endsWith('.js')) {
        if (testUnCoverFiles.includes(item.name)) {
          const code = fs.readFileSync(itemPath, 'utf8')
          // eslint-disable-next-line no-case-declarations
          const ast = parseFileToAST(itemPath)
          const funcsfound = extractAllFunctions(ast, code)
          parseJSFile(resultQueue, itemPath, currentPath, funcsfound)
        }
      }
    }
  }

  // 开始遍历目录
  traverseJSDirectory(dirPath)

  return resultQueue
}

// 解析 Js 文件
function parseJSFile(resultQueue, filePath, currentPath, funcsfound) {
  const fileName = path.basename(filePath)
  for (let index = 0; index < funcsfound.length; index++) {
    const content = funcsfound[index].content
    const functionname = funcsfound[index].name
    if (functionname !== 'anonymous') {
      resultQueue.push({
        currentPath,
        fileName,
        functionname,
        content
      })
    }
  }
}

function findUncoveredFiles(testOutput) {
  const fileContent = fs.readFileSync(testOutput, 'utf8')
  // 正则表达式匹配文件覆盖率的行
  const coverageRegex =
    /^\s*([^\s]+)\s+\|\s+\d+\s+\|\s+\d+\s+\|\s+\d+\s+\|\s+0\s+\|\s+([\d\s,-]+)\s*$/
  const lines = fileContent.split('\n')
  const uncoveredFiles = []

  for (const line of lines) {
    const match = line.match(coverageRegex)
    if (match) {
      const fileName = match[1]
      uncoveredFiles.push(fileName)
    }
  }

  return uncoveredFiles
}

function runUnitTest() {
  // 定义输出文件路径
  const outputFilePath = './testresult.out'

  try {
    execSync('npm install', { encoding: 'utf-8' })
    // 同步执行 npm run test 命令
    const stdout = execSync('npm run test', { encoding: 'utf-8' })

    // 将结果同步写入文件
    fs.writeFileSync(outputFilePath, stdout)

    core.info(`run npm test success: ${outputFilePath}`)
  } catch (error) {
    // 捕获并处理错误
    core.error(`fails in run npm test: ${error.message}`)
  }
}

module.exports = {
  scanJSCodeDirectory,
  findUncoveredFiles,
  parseJSFile,
  runUnitTest
}
