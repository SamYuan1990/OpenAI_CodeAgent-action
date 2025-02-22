const { invokeAIviaAgent } = require('../src/aiagent') // Adjust the path accordingly
const core = require('@actions/core') // Assuming core is imported in your file

// Mock the core.info method
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  debug: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn()
}))

// Mock the openai object
const openai = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
}

// Mock the calculatePercentage function
function calculatePercentage(part, whole) {
  return (part.length / whole.length) * 100
}

describe('invokeAIviaAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should log the correct information and return prompt_info with empty response when dryRun is true', async () => {
    const model = 'gpt-4'
    const prompt = 'Test prompt'
    const fileContent = 'Test file content'
    const dryRun = true

    const result = await invokeAIviaAgent(
      openai,
      model,
      prompt,
      dryRun,
      fileContent
    )

    /*expect(core.info).toHaveBeenCalledWith(
      ' We are going to talk with Gen AI with Model',
      model
    )
    expect(core.info).toHaveBeenCalledWith(
      ' We are going to talk with Gen AI with prompt and file content'
    )
    expect(core.info).toHaveBeenCalledWith(`${prompt}\n${fileContent}`)
    expect(core.info).toHaveBeenCalledWith(
      `just dry run for, ${prompt}\n${fileContent}`
    )*/

    expect(result.model).toBe(model)
    expect(result.final_prompt).toBe(`${prompt}\n${fileContent}`)
    expect(result.response).toBe('')
    expect(result.prompt_precent).toBe(
      calculatePercentage(prompt, `${prompt}\n${fileContent}`)
    )
    expect(result.content_precent).toBe(
      calculatePercentage(fileContent, `${prompt}\n${fileContent}`)
    )
  })

  it('should call openai.chat.completions.create and return prompt_info with AI response when dryRun is false', async () => {
    const model = 'gpt-4'
    const prompt = 'Test prompt'
    const fileContent = 'Test file content'
    const dryRun = false
    const mockResponse = {
      choices: [{ message: { content: 'Mock AI response' } }]
    }

    openai.chat.completions.create.mockResolvedValue(mockResponse)

    const result = await invokeAIviaAgent(
      openai,
      model,
      prompt,
      dryRun,
      fileContent
    )

    /*expect(core.info).toHaveBeenCalledWith(
      '--------Invoke generate AI:--------'
    )
    expect(core.info).toHaveBeenCalledWith(
      '--------This is output from generate AI:--------'
    )
    expect(core.info).toHaveBeenCalledWith(
      mockResponse.choices[0].message.content
    )
    expect(core.info).toHaveBeenCalledWith(
      '--------End of generate AI output--------'
    )*/

    expect(result.model).toBe(model)
    expect(result.final_prompt).toBe(`${prompt}\n${fileContent}`)
    expect(result.response).toBe(mockResponse.choices[0].message.content)
    expect(result.prompt_precent).toBe(
      calculatePercentage(prompt, `${prompt}\n${fileContent}`)
    )
    expect(result.content_precent).toBe(
      calculatePercentage(fileContent, `${prompt}\n${fileContent}`)
    )
  })

  it('should handle errors from openai.chat.completions.create and return prompt_info with empty response', async () => {
    const model = 'gpt-4'
    const prompt = 'Test prompt'
    const fileContent = 'Test file content'
    const dryRun = false
    const mockError = new Error('Mock AI error')

    openai.chat.completions.create.mockRejectedValue(mockError)

    const result = await invokeAIviaAgent(
      openai,
      model,
      prompt,
      dryRun,
      fileContent
    )

    /*expect(core.info).toHaveBeenCalledWith(
      '--------Invoke generate AI:--------'
    )
    expect(core.info).toHaveBeenCalledWith(
      `error happen from LLM response ${mockError}`
    )*/

    expect(result.model).toBe(model)
    expect(result.final_prompt).toBe(`${prompt}\n${fileContent}`)
    expect(result.response).toBe('')
    expect(result.prompt_precent).toBe(
      calculatePercentage(prompt, `${prompt}\n${fileContent}`)
    )
    expect(result.content_precent).toBe(
      calculatePercentage(fileContent, `${prompt}\n${fileContent}`)
    )
  })
})
