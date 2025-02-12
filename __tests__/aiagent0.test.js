const { invokeAIviaAgent } = require('../src/aiagent') // Adjust the path accordingly
const OpenAI = require('openai') // Assuming OpenAI is imported in your file
const core = require('@actions/core') // Assuming core is imported in your file

// Mock the OpenAI and core modules
jest.mock('openai')
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  debug: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn()
}))

describe('invokeAIviaAgent', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    OpenAI.mockClear()
    core.debug.mockClear()
  })

  it('should call OpenAI with the correct parameters and return the completion content', async () => {
    // Arrange
    const mockCompletion = {
      choices: [
        {
          message: {
            content: 'Mocked AI response'
          }
        }
      ]
    }

    const mockCreate = jest.fn().mockResolvedValue(mockCompletion)
    OpenAI.prototype.chat = {
      completions: {
        create: mockCreate
      }
    }

    const baseURL = 'https://api.example.com'
    const apiKey = 'test-api-key'
    const fileContent = 'Test file content'
    const prompt = 'Test prompt'

    const openai = new OpenAI({
      baseURL,
      apiKey
    })

    // Act
    const result = await invokeAIviaAgent(
      openai,
      'deepseek-chat',
      prompt,
      false,
      fileContent
    )

    expect(mockCreate).toHaveBeenCalledWith({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `${prompt}\n${fileContent}` }
      ],
      model: 'deepseek-chat'
    })

    expect(core.info).toHaveBeenCalledWith('Mocked AI response')
    expect(result.response).toBe('Mocked AI response')
  })
})
