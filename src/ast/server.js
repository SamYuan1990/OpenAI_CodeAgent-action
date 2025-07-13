const express = require('express')
const fs = require('fs')
const path = require('path')
const Parser = require('tree-sitter')
const TypeScript = require('tree-sitter-typescript/typescript')

// 初始化 Express 应用
const app = express()
const port = 3001

// 初始化 Tree-sitter 解析器
const parser = new Parser()
parser.setLanguage(TypeScript)

// 中间件 - 解析 JSON 请求体
app.use(express.json())

// GET 端点 - 解析代码库
app.get('/analyze', async (req, res) => {
  try {
    const repoPath = req.query.path || './juice-shop'

    if (!fs.existsSync(repoPath)) {
      return res.status(400).json({ error: 'Directory does not exist' })
    }

    const results = await processRepository(repoPath)
    res.json(results)
  } catch (err) {
    console.error('Error processing request:', err)
    res
      .status(500)
      .json({ error: 'Internal server error', details: err.message })
  }
})
// 主函数：处理整个代码库
async function processRepository(repoPath) {
  const results = []
  let functionCounter = 0

  // 递归遍历目录
  async function traverseDirectory(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await traverseDirectory(fullPath)
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))
      ) {
        await processFile(fullPath)
      }
    }
  }

  // 处理单个文件
  async function processFile(filePath) {
    try {
      const code = await fs.promises.readFile(filePath, 'utf-8')
      const tree = parser.parse(code)

      // 创建查询的新方式
      const query = {
        function: {
          pattern: '(function_declaration) @function',
          matches: []
        },
        method: {
          pattern: '(method_definition) @method',
          matches: []
        },
        arrow: {
          pattern: '(arrow_function) @arrow',
          matches: []
        },
        func: {
          pattern: '(function) @func',
          matches: []
        }
      }

      // 手动遍历节点查找匹配项
      traverseNode(tree.rootNode, query)

      let fileFunctionCounter = 0

      // 处理所有找到的函数
      for (const type in query) {
        for (const match of query[type].matches) {
          const node = match.node

          // 跳过嵌套的函数（只处理顶级函数）
          if (!isTopLevelFunction(node)) continue

          fileFunctionCounter++
          functionCounter++

          const functionInfo = {
            id: functionCounter,
            fileFunctionIndex: fileFunctionCounter,
            filePath: path.relative(repoPath, filePath),
            functionType: type,
            functionName: getFunctionName(node),
            functionContent: node.text,
            startPosition: {
              row: node.startPosition.row,
              column: node.startPosition.column
            },
            endPosition: {
              row: node.endPosition.row,
              column: node.endPosition.column
            },
            calledFunctions: []
          }

          // 查找函数内部调用的其他函数
          findFunctionCalls(node, functionInfo.calledFunctions)

          results.push(functionInfo)
        }
      }
    } catch (err) {
      console.error(`Error processing file ${filePath}:`, err)
    }
  }

  // 递归遍历节点并应用查询
  function traverseNode(node, query) {
    if (!node) return

    // 检查当前节点是否匹配任何查询模式
    for (const type in query) {
      const pattern = query[type].pattern
      const nodeType = pattern.match(/\(([^)]+)\)/)[1]

      if (node.type === nodeType) {
        query[type].matches.push({
          node,
          captures: [] // 简单实现，不处理复杂捕获
        })
      }
    }

    // 递归遍历子节点
    for (let i = 0; i < node.childCount; i++) {
      traverseNode(node.child(i), query)
    }
  }

  // 判断是否是顶级函数
  function isTopLevelFunction(node) {
    let parent = node.parent
    while (parent) {
      if (
        parent.type === 'function_declaration' ||
        parent.type === 'method_definition' ||
        parent.type === 'arrow_function' ||
        parent.type === 'function'
      ) {
        return false
      }
      parent = parent.parent
    }
    return true
  }

  // 获取函数名
  function getFunctionName(node) {
    if (node.type === 'function_declaration') {
      const nameNode = node.childForFieldName('name')
      return nameNode ? nameNode.text : 'anonymous'
    } else if (node.type === 'method_definition') {
      const nameNode = node.childForFieldName('name')
      return nameNode ? nameNode.text : 'anonymous method'
    } else if (node.type === 'arrow_function') {
      return 'arrow function'
    } else {
      return 'anonymous function'
    }
  }

  // 查找函数调用
  function findFunctionCalls(node, calledFunctions) {
    if (!node) return

    // 查找函数调用表达式
    if (node.type === 'call_expression') {
      const functionNode = node.childForFieldName('function')
      if (functionNode) {
        calledFunctions.push({
          calledFunction: functionNode.text,
          position: {
            row: functionNode.startPosition.row,
            column: functionNode.startPosition.column
          }
        })
      }
    }

    // 递归遍历子节点
    for (let i = 0; i < node.childCount; i++) {
      findFunctionCalls(node.child(i), calledFunctions)
    }
  }

  await traverseDirectory(repoPath)
  return results
}

// 启动服务器
app.listen(port, () => {
  console.log(`AST analyzer service running at http://localhost:${port}`)
})

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' })
})
