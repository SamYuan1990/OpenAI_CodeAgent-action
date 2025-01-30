/* eslint-disable filenames/match-regex */
const fs = require('fs')
const path = require('path')
const { parseGoFile } = require('../src/golangScanner') // Adjust the path accordingly

// Mock fs and path modules
jest.mock('fs')
jest.mock('path')

describe('parseGoFile', () => {
  let resultQueue

  beforeEach(() => {
    resultQueue = []
    jest.clearAllMocks()
  })

  it('should parse a Go file and extract function names and Go Docs', () => {
    const filePath = 'example.go'
    const currentPath = '/some/path'
    const funcsfound = [
      { name: 'exampleFunction', content: 'func exampleFunction() {}' }
    ]

    // Mock file content
    const fileContent = `
      // This is a Go Doc for exampleFunction
      func exampleFunction() {
      }
    `

    // Mock fs.readFileSync
    fs.readFileSync.mockReturnValue(fileContent)

    // Mock path.basename
    path.basename.mockReturnValue('example.go')

    // Call the function
    parseGoFile(resultQueue, filePath, currentPath, funcsfound)

    // Assertions
    expect(resultQueue).toEqual([
      {
        currentPath: '/some/path',
        fileName: 'example.go',
        functionName: 'exampleFunction',
        content: 'func exampleFunction() {}',
        hasGoDoc: true
      }
    ])

    // Verify fs.readFileSync was called with the correct file path
    expect(fs.readFileSync).toHaveBeenCalledWith(filePath, 'utf8')

    // Verify path.basename was called with the correct file path
    expect(path.basename).toHaveBeenCalledWith(filePath)
  })

  it('should handle Go files without Go Docs', () => {
    const filePath = 'example.go'
    const currentPath = '/some/path'
    const funcsfound = [
      { name: 'exampleFunction', content: 'func exampleFunction() {}' }
    ]

    // Mock file content without Go Doc
    const fileContent = `
      func exampleFunction() {
        // Function body
      }
    `

    // Mock fs.readFileSync
    fs.readFileSync.mockReturnValue(fileContent)

    // Mock path.basename
    path.basename.mockReturnValue('example.go')

    // Call the function
    parseGoFile(resultQueue, filePath, currentPath, funcsfound)

    // Assertions
    expect(resultQueue).toEqual([
      {
        currentPath: '/some/path',
        fileName: 'example.go',
        functionName: 'exampleFunction',
        content: 'func exampleFunction() {}',
        hasGoDoc: false
      }
    ])
  })

  it('should handle Go files with multiple functions', () => {
    const filePath = 'example.go'
    const currentPath = '/some/path'
    const funcsfound = [
      { name: 'exampleFunction1', content: 'func exampleFunction1() {}' },
      { name: 'exampleFunction2', content: 'func exampleFunction2() {}' }
    ]

    // Mock file content with multiple functions
    const fileContent = `
      // This is a Go Doc for exampleFunction1
      func exampleFunction1() {
        // Function body
      }

      func exampleFunction2() {
        // Function body
      }
    `

    // Mock fs.readFileSync
    fs.readFileSync.mockReturnValue(fileContent)

    // Mock path.basename
    path.basename.mockReturnValue('example.go')

    // Call the function
    parseGoFile(resultQueue, filePath, currentPath, funcsfound)

    // Assertions
    expect(resultQueue).toEqual([
      {
        currentPath: '/some/path',
        fileName: 'example.go',
        functionName: 'exampleFunction1',
        content: 'func exampleFunction1() {}',
        hasGoDoc: true
      },
      {
        currentPath: '/some/path',
        fileName: 'example.go',
        functionName: 'exampleFunction2',
        content: 'func exampleFunction2() {}',
        hasGoDoc: false
      }
    ])
  })

  it('should not add functions to resultQueue if they are not in funcsfound', () => {
    const filePath = 'example.go'
    const currentPath = '/some/path'
    const funcsfound = [
      { name: 'exampleFunction1', content: 'func exampleFunction1() {}' }
    ]

    // Mock file content with a function not in funcsfound
    const fileContent = `
      func exampleFunction2() {
        // Function body
      }
    `

    // Mock fs.readFileSync
    fs.readFileSync.mockReturnValue(fileContent)

    // Mock path.basename
    path.basename.mockReturnValue('example.go')

    // Call the function
    parseGoFile(resultQueue, filePath, currentPath, funcsfound)

    // Assertions
    expect(resultQueue).toEqual([])
  })
})
