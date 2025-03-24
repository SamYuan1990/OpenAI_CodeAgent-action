const { preparePrompt, invokeAIviaAgent } = require('../src/aiagent') // Adjust the path accordingly

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
    const fileContent = { fileContent: 'Test file content' }
    const prompt = 'Test prompt\n <%= fileContent %>'
    const dryRun = true

    const folderName = '/tmp'
    const control_group = {
      folderName
    }

    const promptcontent = preparePrompt(prompt, fileContent, control_group)
    const result = await invokeAIviaAgent(openai, model, dryRun, promptcontent)

    expect(result.model).toBe(model)
    expect(result.final_prompt).toBe(promptcontent.final_prompt)
    expect(result.response).toBe('')
    expect(result.prompt_precent).toBe(
      calculatePercentage(prompt, promptcontent.final_prompt)
    )
    expect(result.content_precent).toBe(
      1 - calculatePercentage(prompt, promptcontent.final_prompt)
    )
  })

  it('should call openai.chat.completions.create and return prompt_info with AI response when dryRun is false', async () => {
    const model = 'gpt-4'
    const fileContent = { fileContent: 'Test file content' }
    const prompt = 'Test prompt\n <%= fileContent %>'
    const dryRun = false
    const mockResponse = {
      choices: [{ message: { content: 'Mock AI response' } }]
    }

    const folderName = '/tmp'
    const control_group = {
      folderName
    }

    openai.chat.completions.create.mockResolvedValue(mockResponse)
    const promptcontent = preparePrompt(prompt, fileContent, control_group)
    const result = await invokeAIviaAgent(openai, model, dryRun, promptcontent)

    expect(result.model).toBe(model)
    expect(result.final_prompt).toBe(promptcontent.final_prompt)
    expect(result.response).toBe(mockResponse.choices[0].message.content)
    expect(result.prompt_precent).toBe(
      calculatePercentage(prompt, promptcontent.final_prompt)
    )
    expect(result.content_precent).toBe(
      1 - calculatePercentage(prompt, promptcontent.final_prompt)
    )
  })

  it('should handle errors from openai.chat.completions.create and return prompt_info with empty response', async () => {
    const model = 'gpt-4'
    const fileContent = { fileContent: 'Test file content' }
    const prompt = 'Test prompt\n <%= fileContent %>'
    const dryRun = false
    const mockError = new Error('Mock AI error')

    openai.chat.completions.create.mockRejectedValue(mockError)

    const folderName = '/tmp'
    const control_group = {
      folderName
    }

    const promptcontent = preparePrompt(prompt, fileContent, control_group)
    const result = await invokeAIviaAgent(openai, model, dryRun, promptcontent)

    expect(result.model).toBe(model)
    expect(result.final_prompt).toBe(promptcontent.final_prompt)
    expect(result.response).toBe('')
    expect(result.prompt_precent).toBe(
      calculatePercentage(prompt, promptcontent.final_prompt)
    )
    expect(result.content_precent).toBe(
      1 - calculatePercentage(prompt, promptcontent.final_prompt)
    )
  })
})
