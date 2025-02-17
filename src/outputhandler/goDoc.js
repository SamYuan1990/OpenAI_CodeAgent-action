const fs = require('fs')
const core = require('@actions/core')

/**
 * 在 Go 文件中为特定函数插入注释
 * @param {string} filePath - Go 文件路径
 * @param {string} funcName - 函数名
 * @param {string[]} comments - 要插入的注释行（数组）
 */
function insertCommentAboveFunction(filePath, funcName, comments) {
  // 读取文件内容
  const fileContent = fs.readFileSync(filePath, 'utf-8')

  // 构建正则表达式，匹配函数定义
  const funcRegex = new RegExp(`(\\n\\s*func\\s+${funcName}\\s*\\([^{]*{)`, 'g')

  // 检查是否找到函数定义
  if (!funcRegex.test(fileContent)) {
    core.error(`未找到函数 "${funcName}" 的定义`)
    return
  }

  // 构建注释字符串
  const commentStr = `${comments.map(comment => `// ${comment}`).join('\n')}\n`

  // 在函数定义的上一行插入注释
  const newFileContent = fileContent.replace(funcRegex, match => {
    // 在匹配的函数定义前插入注释
    return `\n${commentStr}${match.trimStart()}`
  })

  // 将修改后的内容写回文件
  fs.writeFileSync(filePath, newFileContent, 'utf-8')

  core.info(`已成功在函数 "${funcName}" 的上一行插入注释`)
}

/*
// 示例用法
const filePath = './example/utils/utils.go' // Go 文件路径
const funcName = 'Helper' // 函数名
const comments = [
  'This is a comment line 1',
  'This is a comment line 2',
  'This is a comment line 3'
] // 要插入的注释

insertCommentAboveFunction(filePath, funcName, comments)
*/

/**
 * 提取 Go 代码中指定函数定义前的注释
 * @param {string} code - Go 代码
 * @param {string} funcName - 函数名
 * @returns {string} - 提取的注释内容
 */
function extractFunctionComment(code, funcName) {
  // 构建正则表达式，匹配函数定义前的注释
  const regex = new RegExp(
    `(\\/\\/[^\\n]*\\n)*\\s*func\\s+${funcName}\\s*\\(`,
    'g'
  )

  // 查找匹配的注释
  const match = regex.exec(code)
  if (!match) {
    return code
  }

  // 提取注释部分
  const commentBlock = match[0]
    .replace(new RegExp(`\\s*func\\s+${funcName}\\s*\\(`, 'g'), '')
    .trim()
  return commentBlock
}

/*
// 示例 Go 代码
const goCode = `
package main

import "fmt"

// Helper prints a fixed message "Helper function" to the standard output (console).
// 
// This function is primarily intended for demonstration purposes, serving as a simple
// example of how to define and call a function in Go. It can also be used as a
// placeholder during development or as a debugging aid to verify code execution flow.
//
// Example usage:
//
//	Helper() // Output: Helper function
//
// Notes:
// - The function does not take any parameters.
// - The function does not return any values.
// - The output is always "Helper function".
func Helper() {
    fmt.Println("Helper function")
}

func main() {
    Helper()
}
`

// 提取 Helper 函数的注释
try {
  const comment = extractFunctionComment(goCode, 'Helper')
  console.log(comment)
} catch (error) {
  console.error(error.message)
}
*/
module.exports = {
  insertCommentAboveFunction,
  extractFunctionComment
}
