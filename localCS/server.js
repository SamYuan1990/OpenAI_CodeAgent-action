// server.js
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')

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
    console.log(filePath)
    console.log(data)
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
app.post('/send-task/:filename', (req, res) => {
  const filePath = path.join(directoryPath, req.params.filename)
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Unable to read file')
    }
    const jsonData = JSON.parse(data)
    const task = jsonData[req.body.field] // 从请求体中获取字段名

    // 这里可以调用大模型的API
    console.log(`Sending task to model: ${task}`)
    const modelResponse = 'ABC'
    jsonData.response = modelResponse

    fs.writeFile(
      filePath,
      JSON.stringify(jsonData, null, 2),
      'utf8',
      writeErr => {
        if (writeErr) {
          return res.status(500).send('Unable to write file')
        }

        // 发送响应，触发页面重新加载
        res.send('Task completed and file updated. Reloading page...')
      }
    )
  })
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
