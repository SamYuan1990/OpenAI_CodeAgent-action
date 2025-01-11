const {
  run,
  writeFileForAarray,
  readFileSync,
  invokeAIviaAgent
} = require('../src/main')
const core = require('@actions/core')
const fs = require('fs')
const OpenAI = require('openai')

// Mocking the @actions/core module
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  debug: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn()
}))

// Mocking the fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}))
jest.mock('openai')

describe('run function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle the workflow correctly', async () => {
    const mockBaseURL = 'https://api.example.com'
    const mockApiKey = '1234'
    const mockFileOverWrite = 'false'
    const mockFileContent = 'mock file content'
    const mockAIData = '\nmock code\n```\n###'

    jest.spyOn(core, 'getInput').mockImplementation(input => {
      switch (input) {
        case 'baseURL':
          return mockBaseURL
        case 'apiKey':
          return mockApiKey
        case 'fileOverWrite':
          return mockFileOverWrite
        default:
          return ''
      }
    })

    jest.spyOn(fs, 'readFileSync').mockReturnValue(mockFileContent)
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})

    const mockCompletion = {
      choices: [{ message: { content: mockAIData } }]
    }
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockCompletion)
        }
      }
    }
    OpenAI.mockImplementation(() => mockOpenAI)

    await run()

    expect(core.getInput).toHaveBeenCalledWith('baseURL', { required: true })
    expect(core.getInput).toHaveBeenCalledWith('apiKey', { required: true })
    expect(core.getInput).toHaveBeenCalledWith('fileOverWrite', {
      required: true
    })
    expect(fs.readFileSync).toHaveBeenCalledWith('./src/main.js', 'utf8')
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalled()
    //expect(fs.writeFileSync).toHaveBeenCalled()
    //expect(core.info).toHaveBeenCalledWith('file writed')
  })

  it('should handle errors correctly', async () => {
    const mockError = new Error('mock error')

    jest.spyOn(core, 'getInput').mockImplementation(() => {
      throw mockError
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(mockError.message)
  })
})

describe('writeFileForAarray function', () => {
  it('should write content to file correctly', () => {
    const mockFilePath = './__tests__/main.test.js'
    const mockContent = ['mock code']

    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})

    writeFileForAarray(mockFilePath, mockContent)

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      mockFilePath,
      'mock code',
      'utf8'
    )
    expect(core.info).toHaveBeenCalledWith('file writed')
  })

  it('should handle file write errors', () => {
    const mockFilePath = './__tests__/main.test.js'
    const mockContent = ['mock code']
    const mockError = new Error('write error')

    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw mockError
    })
    jest.spyOn(core, 'info').mockImplementation(() => {})

    writeFileForAarray(mockFilePath, mockContent)

    expect(core.info).toHaveBeenCalledWith('file write error:', mockError)
  })
})

describe('readFileSync', () => {
  it('should read file content successfully', () => {
    const mockContent = 'mock file content'
    fs.readFileSync.mockReturnValue(mockContent)

    const result = readFileSync('path/to/file')
    expect(result).toBe(mockContent)
    expect(fs.readFileSync).toHaveBeenCalledWith('path/to/file', 'utf8')
  })

  it('should return null and log error if file read fails', () => {
    const mockError = new Error('File read error')
    fs.readFileSync.mockImplementation(() => {
      throw mockError
    })

    console.error = jest.fn() // Mock console.error

    const result = readFileSync('path/to/file')
    expect(result).toBeNull()
    expect(console.error).toHaveBeenCalledWith('error read file:', mockError)
  })
})

describe('invokeAIviaAgent function', () => {
  it('should return dummy data when apiKey is dummy', async () => {
    const mockBaseURL = 'https://api.example.com'
    const mockApiKey = 'dummy'
    const mockFileContent = 'mock file content'

    const result = await invokeAIviaAgent(
      mockBaseURL,
      mockApiKey,
      mockFileContent
    )

    expect(result).toBe('hello world')
  })

  it('should invoke OpenAI API correctly', async () => {
    const mockBaseURL = 'https://api.example.com'
    const mockApiKey = 'valid-api-key'
    const mockFileContent = 'mock file content'
    const mockAIData = 'mock AI data'

    const mockCompletion = {
      choices: [{ message: { content: mockAIData } }]
    }
    const mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockCompletion)
        }
      }
    }
    OpenAI.mockImplementation(() => mockOpenAI)

    const result = await invokeAIviaAgent(
      mockBaseURL,
      mockApiKey,
      mockFileContent
    )

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        {
          role: 'user',
          content: `Please help me create unit test file with jest framework, using spyOn but not mock the require package for following, all the content in a single file:\n${mockFileContent}`
        }
      ],
      model: 'deepseek-chat'
    })
    expect(result).toBe(mockAIData)
  })
})
