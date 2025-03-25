// server.js
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const { preparePrompt, invokeAIviaAgent } = require('../src/agents/aiagent')
const { logger } = require('../src/utils/logger')
const OpenAI = require('openai')
const { getInputOrDefault } = require('../src/utils/inputFilter')

const app = express()
const port = 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))

const directoryPath = path.join(__dirname, 'data') // 指定目录路径

// 获取目录中的文件列表
app.get('/files', (req, res) => {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory')
    }
    const jsonFiles = files.filter(
      file => path.extname(file).toLowerCase() === '.out'
    )

    res.json(jsonFiles)
  })
})

// 读取指定文件内容
app.get('/file/:filename', (req, res) => {
  const filePath = path.join(directoryPath, req.params.filename)
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Unable to read file')
    }
    logger.Info(filePath)
    logger.Info(data)
    res.json(JSON.parse(data))
  })
})

// 标记文件为处理完成
app.post('/mark-done/:filename', (req, res) => {
  const filePath = path.join(directoryPath, req.params.filename)
  fs.rename(
    filePath,
    path.join(directoryPath, `done_${req.params.filename}.done`),
    err => {
      if (err) {
        return res.status(500).send('Unable to mark file as done')
      }
      res.send('File marked as done')
    }
  )
})

// 发送任务到大模型
app.post('/send-task/:filename', async (req, res) => {
  const filePath = path.join(directoryPath, req.params.filename)

  try {
    const data = await fs.promises.readFile(filePath, 'utf8')
    const jsonData = JSON.parse(data)
    const task = jsonData[req.body.field] // 从请求体中获取字段名

    // 这里可以调用大模型的API
    logger.Info(`Sending task to model: ${task}`)
    const control_group = {
      folderName: ''
    }
    const promptContent = preparePrompt(task, '', control_group)

    const baseURL = getInputOrDefault('baseURL', 'https://api.deepseek.com')
    logger.Info(`We are going to talk with Gen AI with URL ${baseURL}`)

    const apiKey = getInputOrDefault('apiKey', '')
    // creation of AI agent
    const openai = new OpenAI({
      baseURL,
      apiKey
    })
    const model = getInputOrDefault('model', 'deepseek-chat')
    logger.Info(`We are going to talk with Gen AI with Model ${model}`)

    const LLMresponse = await invokeAIviaAgent(
      openai,
      model,
      false,
      promptContent
    )

    jsonData.response = LLMresponse.response
    jsonData.outputToken = LLMresponse.outputToken
    jsonData.time_usage = LLMresponse.time_usage

    await fs.promises.writeFile(
      filePath,
      JSON.stringify(jsonData, null, 2),
      'utf8'
    )

    // 发送响应，触发页面重新加载
    res.send('Task completed and file updated. Reloading page...')
  } catch (err) {
    // 捕获并处理错误
    logger.Error(`Error: ${err.message}`)
    res.status(500).send('An error occurred while processing the task')
  }
})

app.listen(port, () => {
  logger.Info(`Server is running on http://localhost:${port}`)
})
