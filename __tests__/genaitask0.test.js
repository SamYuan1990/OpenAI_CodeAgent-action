const fs = require('fs')
const { generateGenAItaskQueue } = require('../src/genaitask') // Adjust the path accordingly
const core = require('@actions/core') // Assuming core is from @actions/core
const {
  parseFileToAST,
  extractAllFunctions
} = require('../src/languageprocessor/inputprocessor') // Adjust the path accordingly

jest.mock('../src/languageprocessor/inputprocessor', () => ({
  parseFileToAST: jest.fn(),
  extractAllFunctions: jest.fn()
}))

// Mocking fs, core, and AST utilities
jest.mock('fs')
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  debug: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn()
}))
describe('generateGenAItaskQueue', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('should generate a task queue for a task with inputFileProcessMethod "by_function"', async () => {
    // Mock task object
    const task = {
      id: 'task1',
      inputFilePath: 'path/to/input/file.js',
      outputProcessMethod: 'method1',
      prompt: 'Generate code',
      inputFileProcessMethod: 'by_function',
      outputFilePath: 'path/to/output/file_{{index}}.js'
    }

    // Mock fs.readFileSync to return a sample code
    fs.readFileSync.mockReturnValue('function foo() { return "bar"; }')

    // Mock parseFileToAST and extractAllFunctions
    const mockAST = {} // Mock AST object
    parseFileToAST.mockReturnValue(mockAST)
    extractAllFunctions.mockReturnValue([
      { name: 'foo', content: 'function foo() { return "bar"; }' }
    ])

    // Mock core.debug to capture debug logs
    const debugLogs = []
    core.debug.mockImplementation(message => debugLogs.push(message))

    // Call the function
    const result = await generateGenAItaskQueue(task)

    // Assertions
    expect(fs.readFileSync).toHaveBeenCalledWith(
      'path/to/input/file.js',
      'utf8'
    )
    expect(parseFileToAST).toHaveBeenCalledWith('path/to/input/file.js')
    expect(extractAllFunctions).toHaveBeenCalledWith(
      mockAST,
      'function foo() { return "bar"; }'
    )

    expect(result).toEqual([
      {
        id: 'task10',
        code_language: 'js',
        prompt: 'Generate code',
        content: 'function foo() { return "bar"; }',
        outputProcessMethod: 'method1',
        outputFilePath: 'path/to/output/file_0.js'
      }
    ])

    // Check debug logs
    expect(debugLogs).toContain('Function 0:')
    expect(debugLogs).toContain('Name: foo')
    expect(debugLogs).toContain('Content:\nfunction foo() { return "bar"; }\n')
    expect(debugLogs).toContain('path/to/output/file_0.js')
  })

  it('should return an empty task queue if inputFileProcessMethod is not "by_function"', async () => {
    // Mock task object with a different inputFileProcessMethod
    const task = {
      id: 'task1',
      inputFilePath: 'path/to/input/file.js',
      outputProcessMethod: 'method1',
      prompt: 'Generate code',
      inputFileProcessMethod: 'by_other_method',
      outputFilePath: 'path/to/output/file_{{index}}.js'
    }

    // Call the function
    const result = await generateGenAItaskQueue(task)

    // Assertions
    expect(result).toEqual([])
    expect(fs.readFileSync).not.toHaveBeenCalled()
    expect(parseFileToAST).not.toHaveBeenCalled()
    expect(extractAllFunctions).not.toHaveBeenCalled()
  })

  it('should handle multiple functions in the input file', async () => {
    // Mock task object
    const task = {
      id: 'task1',
      inputFilePath: 'path/to/input/file.js',
      outputProcessMethod: 'method1',
      prompt: 'Generate code',
      inputFileProcessMethod: 'by_function',
      outputFilePath: 'path/to/output/file_{{index}}.js'
    }

    // Mock fs.readFileSync to return a sample code
    fs.readFileSync.mockReturnValue(`
      function foo() { return "bar"; }
      function baz() { return "qux"; }
    `)

    // Mock parseFileToAST and extractAllFunctions
    const mockAST = {} // Mock AST object
    parseFileToAST.mockReturnValue(mockAST)
    extractAllFunctions.mockReturnValue([
      { name: 'foo', content: 'function foo() { return "bar"; }' },
      { name: 'baz', content: 'function baz() { return "qux"; }' }
    ])

    // Call the function
    const result = await generateGenAItaskQueue(task)

    // Assertions
    expect(result).toEqual([
      {
        id: 'task10',
        code_language: 'js',
        prompt: 'Generate code',
        content: 'function foo() { return "bar"; }',
        outputProcessMethod: 'method1',
        outputFilePath: 'path/to/output/file_0.js'
      },
      {
        id: 'task11',
        code_language: 'js',
        prompt: 'Generate code',
        content: 'function baz() { return "qux"; }',
        outputProcessMethod: 'method1',
        outputFilePath: 'path/to/output/file_1.js'
      }
    ])
  })
})
