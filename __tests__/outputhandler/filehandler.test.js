const fs = require('fs')
const core = require('@actions/core')
const { writeFileForAarray } = require('../../src/outputhandler/file_handler') // Adjust the path accordingly

// Mock the fs module
jest.mock('fs')

// Mock the core module
jest.mock('@actions/core', () => ({
  debug: jest.fn(),
  info: jest.fn()
}))

describe('writeFileForAarray', () => {
  const filePath = 'test.txt'
  const content = ['line1', 'line2', 'line3']

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should write content to the file successfully', () => {
    // Mock fs.writeFileSync to not throw an error
    fs.writeFileSync.mockImplementation(() => {})

    writeFileForAarray(filePath, content)

    // Check if fs.writeFileSync was called with the correct arguments
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      'line1,line2,line3',
      'utf8'
    )

    // Check if core.debug was called with the correct content
    expect(core.debug).toHaveBeenCalledWith('line1,line2,line3')

    // Check if core.info was called with the success message
    expect(core.info).toHaveBeenCalledWith('file writed')
  })

  it('should handle file write error', () => {
    const errorMessage = 'Failed to write file'

    // Mock fs.writeFileSync to throw an error
    fs.writeFileSync.mockImplementation(() => {
      throw new Error(errorMessage)
    })

    writeFileForAarray(filePath, content)

    // Check if fs.writeFileSync was called with the correct arguments
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      filePath,
      'line1,line2,line3',
      'utf8'
    )

    // Check if core.debug was called with the correct content
    expect(core.debug).toHaveBeenCalledWith('line1,line2,line3')

    // Check if core.info was called with the error message
    expect(core.info).toHaveBeenCalledWith(`file write error: ${errorMessage}`)
  })
})
