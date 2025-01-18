const fs = require('fs')
const acorn = require('acorn')

function parseFileToAST(filePath) {
  const code = fs.readFileSync(filePath, 'utf8')
  return acorn.parse(code, {
    ecmaVersion: 'latest', // 使用最新的 ECMAScript 版本
    locations: true // 保留位置信息
  })
}
/**
 * 遍历 AST 并提取所有函数的内容
 * @param {object} ast 解析后的 AST
 * @param {string} code 原始代码
 * @returns {Array<object>} 包含所有函数信息的数组
 */
function extractAllFunctions(ast, code) {
  const functions = []
  traverse(ast, code, functions) // 调用独立的遍历函数
  return functions
}

/**
 * 递归遍历 AST 并提取函数信息
 * @param {object} node 当前 AST 节点
 * @param {string} code 原始代码
 * @param {Array<object>} functions 存储函数信息的数组
 */
function traverse(node, code, functions) {
  // 检查是否为函数声明
  if (node.type === 'FunctionDeclaration') {
    functions.push({
      type: 'FunctionDeclaration',
      name: node.id ? node.id.name : 'anonymous', // 函数名（匿名函数则为 'anonymous'）
      content: code.slice(node.start, node.end) // 函数内容
    })
  }

  // 检查是否为函数表达式
  if (node.type === 'FunctionExpression') {
    functions.push({
      type: 'FunctionExpression',
      name: node.id ? node.id.name : 'anonymous', // 函数名（匿名函数则为 'anonymous'）
      content: code.slice(node.start, node.end) // 函数内容
    })
  }

  // 检查是否为箭头函数
  if (node.type === 'ArrowFunctionExpression') {
    functions.push({
      type: 'ArrowFunctionExpression',
      name: 'anonymous', // 箭头函数通常是匿名的
      content: code.slice(node.start, node.end) // 函数内容
    })
  }

  // 遍历子节点
  for (const key in node) {
    if (node[key] && typeof node[key] === 'object') {
      traverse(node[key], code, functions) // 递归遍历子节点
    }
  }
}

module.exports = {
  parseFileToAST,
  extractAllFunctions,
  traverse
}
