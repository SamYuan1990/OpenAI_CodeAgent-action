const fs = require('fs')
const path = require('path')
const core = require('@actions/core')
const { run } = require('../src/main') // Adjust the path to your file

// Mocking the dependencies
jest.mock('fs')
jest.mock('path')
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  debug: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn()
}))

// Mocking the external functions
const { processOutput } = require('../src/outputhandler/ouputprocessor')
const { invokeAIviaAgent } = require('../src/aiagent')
const { generateGenAItaskQueue } = require('../src/genaitask')

jest.mock('../src/outputhandler/ouputprocessor', () => ({
  processOutput: jest.fn()
}))

jest.mock('../src/aiagent', () => ({
  invokeAIviaAgent: jest.fn()
}))

jest.mock('../src/genaitask', () => ({
  generateGenAItaskQueue: jest.fn()
}))

describe('run function', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('should handle empty tasks file', async () => {
    // Mock fs.readFileSync to return an empty array
    fs.readFileSync.mockReturnValueOnce(JSON.stringify([]))

    // Mock core.getInput to return dummy values
    core.getInput.mockImplementation(key => {
      if (key === 'baseURL') return 'http://example.com'
      if (key === 'apiKey') return 'dummy-key'
    })

    await run()

    // Assertions
    expect(core.info).toHaveBeenCalledWith('None task for process, return')
    expect(generateGenAItaskQueue).not.toHaveBeenCalled()
  })

  it('should process tasks and invoke AI agent', async () => {
    // Mock fs.readFileSync to return a tasks array
    const mockTasks = {
      tasks: [
        {
          id: 'task1',
          content: 'content1',
          prompt: 'prompt1',
          outputFilePath: 'output1'
        }
      ]
    }
    fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockTasks))

    // Mock core.getInput to return dummy values
    core.getInput.mockImplementation(key => {
      if (key === 'baseURL') return 'http://example.com'
      if (key === 'apiKey') return 'dummy-key'
      if (key === 'model') return 'deepseek-chat'
    })

    // Mock generateGenAItaskQueue to return a task queue
    const mockGenAItaskQueue = [
      {
        id: 'task1',
        content: 'content1',
        prompt: 'prompt1',
        outputFilePath: 'output1'
      }
    ]
    generateGenAItaskQueue.mockResolvedValueOnce(mockGenAItaskQueue)

    // Mock invokeAIviaAgent to return some data
    const mockAIData = { result: 'success' }
    invokeAIviaAgent.mockResolvedValueOnce(mockAIData)

    await run()

    // Assertions
    expect(core.info).toHaveBeenCalledWith(
      'start process task into GenAI task',
      'task1'
    )
    expect(generateGenAItaskQueue).toHaveBeenCalledWith(mockTasks.tasks[0])
    expect(invokeAIviaAgent).toHaveBeenCalledWith(
      'http://example.com',
      'dummy-key',
      'content1',
      'prompt1',
      'deepseek-chat'
    )
    expect(processOutput).toHaveBeenCalledWith(
      mockAIData,
      mockGenAItaskQueue[0]
    )
  })

  it('should handle errors and fail the workflow', async () => {
    // Mock fs.readFileSync to throw an error
    fs.readFileSync.mockImplementationOnce(() => {
      throw new Error('File read error')
    })

    await run()

    // Assertions
    expect(core.setFailed).toHaveBeenCalledWith('File read error')
  })

  it('should handle test usage with dummy apiKey', async () => {
    // Mock fs.readFileSync to return a tasks array
    const mockTasks = {
      tasks: [
        {
          id: 'task1',
          content: 'content1',
          prompt: 'prompt1',
          outputFilePath: 'output1'
        }
      ]
    }
    fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockTasks))

    // Mock core.getInput to return dummy values
    core.getInput.mockImplementation(key => {
      if (key === 'baseURL') return 'http://example.com'
      if (key === 'apiKey') return 'dummy'
    })

    // Mock generateGenAItaskQueue to return a task queue
    const mockGenAItaskQueue = [
      {
        id: 'task1',
        content: 'content1',
        prompt: 'prompt1',
        outputFilePath: 'output1'
      }
    ]
    generateGenAItaskQueue.mockResolvedValueOnce(mockGenAItaskQueue)

    await run()

    // Assertions
    expect(core.info).toHaveBeenCalledWith('for test usage, continue')
    expect(invokeAIviaAgent).not.toHaveBeenCalled()
  })
})
