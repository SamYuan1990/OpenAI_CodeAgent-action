const fs = require('fs')
const path = require('path')
const Parser = require('tree-sitter')
const CTree = require('tree-sitter-c')
const { logger } = require('../utils/logger')

// 递归扫描目录中的所有C文件
function scanDirectory(dir) {
  // 初始化tree-sitter解析器
  const parser = new Parser()
  parser.setLanguage(CTree)
  const files = fs.readdirSync(dir)
  const cFiles = files.filter(
    file => file.endsWith('.c') || file.endsWith('.cpp')
  )
  const result = []

  for (const file of cFiles) {
    const filePath = path.join(dir, file)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const ast = parser.parse(fileContent)

    // 提取函数信息
    extractFunctions(ast.rootNode, filePath, result)
  }

  logger.Info(`scanned C function as ${result.length}`)
  return result
}

// 提取函数信息并添加到结果数组中
function extractFunctions(node, filePath, result) {
  if (node.type === 'function_definition') {
    const functionNameNode = node.childForFieldName('declarator')
    const functionName =
      functionNameNode?.childForFieldName('declarator')?.text || 'anonymous'

    const content = node.text
    const hasComment = node.previousSibling?.type === 'comment'
    const commentContent = hasComment ? node.previousSibling.text : ''

    result.push({
      functionname: functionName,
      fileName: filePath,
      isCovered: false, // 默认未覆盖
      hasComment,
      content,
      commentContent
    })
  }

  // 递归遍历子节点
  for (const child of node.children) {
    extractFunctions(child, filePath, result)
  }
}

module.exports = {
  scanDirectory
}

// 主函数
function main() {
  const projectDir = process.argv[2] // 从命令行参数获取项目目录
  if (!projectDir) {
    console.error('请提供项目目录路径')
    process.exit(1)
  }

  const result = scanDirectory(projectDir)
  console.log(JSON.stringify(result, null, 2))
}

main()
