/* eslint-disable prettier/prettier */
const core = require('@actions/core')
const { execSync } = require('child_process')
const { parseLcovFile, scanDirectory } = require('./languageprocessor/nodeAst')
const path = require('path')
/**
 * 扫描 Go 代码目录并构建数据结构队列
 * @param {string} dirPath - 要扫描的 Go 代码目录路径
 * @returns {Array} - 返回一个包含文件名、函数名和是否存在 Go Doc 的数据结构队列
 */
function scanJSCodeDirectory(dirPath) {
  runUnitTest()
  const lcovFilePath = path.join('./', 'coverage', 'lcov.info')
  const coverageData = parseLcovFile(lcovFilePath)
  const results = scanDirectory(coverageData, dirPath)
  return results
}
function runUnitTest() {
  // 定义输出文件路径
  const outputFilePath = './testresult.out'
  try {
    execSync('npm install', { encoding: 'utf-8' })
    // 同步执行 npm run test 命令
    execSync('npx jest --coverage', { encoding: 'utf-8' })
    core.info(`run npm test success: ${outputFilePath}`)
  } catch (error) {
    // 捕获并处理错误
    core.error(`fails in run npm test: ${error.message}`)
  }
}

module.exports = {
  scanJSCodeDirectory,
  runUnitTest
}
