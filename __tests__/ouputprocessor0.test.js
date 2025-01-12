const { processOutput } = require('../src/ouputprocessor') // Adjust the path accordingly
const core = require('@actions/core')
const { writeFileForAarray } = require('../src/file_handler') // Adjust the path accordingly

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  debug: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn()
}))

jest.mock('../src/file_handler', () => ({
  writeFileForAarray: jest.fn()
}))

describe('processOutput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should process output with regex_match and write to file if fileOverWrite is true', () => {
    const dataFromAIAgent = `
\`\`\`javascript
const a = 1;
\`\`\`

###
`
    const GenAItask = {
      outputProcessMethod: 'regex_match',
      outputFilePath: 'output.js'
    }

    core.getInput.mockReturnValue('true')

    processOutput(dataFromAIAgent, GenAItask)

    expect(core.getInput).toHaveBeenCalledWith('fileOverWrite', {
      required: true
    })
    expect(writeFileForAarray).toHaveBeenCalledWith('output.js', [
      'const a = 1;'
    ])
    expect(core.debug).toHaveBeenCalledWith('content:', ['const a = 1;'])
  })

  it('should process output with regex_match and log content if fileOverWrite is false', () => {
    const dataFromAIAgent = `
\`\`\`javascript
const a = 1;
\`\`\`

###
`
    const GenAItask = {
      outputProcessMethod: 'regex_match',
      outputFilePath: 'output.js'
    }

    core.getInput.mockReturnValue('false')

    processOutput(dataFromAIAgent, GenAItask)

    expect(core.getInput).toHaveBeenCalledWith('fileOverWrite', {
      required: true
    })
    expect(core.info).toHaveBeenCalledWith(['const a = 1;'])
    expect(core.debug).toHaveBeenCalledWith('content:', ['const a = 1;'])
  })

  it('should log "content not found" if no matches are found', () => {
    const dataFromAIAgent = 'No match here'
    const GenAItask = {
      outputProcessMethod: 'regex_match',
      outputFilePath: 'output.js'
    }

    core.getInput.mockReturnValue('true')

    processOutput(dataFromAIAgent, GenAItask)

    expect(core.getInput).toHaveBeenCalledWith('fileOverWrite', {
      required: true
    })
    expect(core.info).toHaveBeenCalledWith('content not found')
    expect(writeFileForAarray).not.toHaveBeenCalled()
  })

  it('should do nothing if outputProcessMethod is not regex_match', () => {
    const dataFromAIAgent = `
\`\`\`javascript
const a = 1;
\`\`\`

###
`
    const GenAItask = {
      outputProcessMethod: 'other_method',
      outputFilePath: 'output.js'
    }

    core.getInput.mockReturnValue('true')

    processOutput(dataFromAIAgent, GenAItask)

    expect(core.getInput).toHaveBeenCalled()
    expect(writeFileForAarray).not.toHaveBeenCalled()
    expect(core.info).not.toHaveBeenCalled()
    expect(core.debug).not.toHaveBeenCalled()
  })
})
