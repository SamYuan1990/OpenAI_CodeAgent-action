const { preparePrompt, invokeAIviaAgent } = require('../src/aiagent') // Adjust the path accordingly
const OpenAI = require('openai') // Assuming OpenAI is imported in your file

jest.mock('openai')
describe('invokeAIviaAgent', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    OpenAI.mockClear()
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

    const folderName = '/tmp'
    const control_group = {
      folderName
    }

    const promptcontent = preparePrompt(prompt, fileContent, control_group)
    console.log('debug')
    console.log(promptcontent)
    console.log('debug')
    const result = await invokeAIviaAgent(
      openai,
      'deepseek-chat',
      false,
      promptcontent
    )
    // Act
    expect(mockCreate).toHaveBeenCalledWith({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `${prompt}\n${fileContent}` }
      ],
      model: 'deepseek-chat'
    })

    //expect(core.info).toHaveBeenCalledWith('Mocked AI response')
    expect(result.response).toBe('Mocked AI response')
  })
})
