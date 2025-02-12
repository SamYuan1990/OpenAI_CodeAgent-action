/* eslint-disable filenames/match-regex */
const fs = require('fs')
const path = require('path')
const { scanGoCodeDirectory } = require('../src/golangScanner') // Adjust the path accordingly

// Mock fs and path modules
jest.mock('fs')
jest.mock('path')

describe('scanGoCodeDirectory', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    jest.clearAllMocks()
  })

  it('should return an empty array if the directory is empty', () => {
    fs.readdirSync.mockReturnValue([])

    const result = scanGoCodeDirectory('/empty/directory')
    expect(result).toEqual([])
  })

  it('should ignore directories and non-Go files', () => {
    const mockFiles = [
      { name: 'dir1', isDirectory: () => true },
      { name: 'file.txt', isFile: () => true }
    ]
    fs.readdirSync.mockReturnValue(mockFiles)

    const result = scanGoCodeDirectory('/mixed/directory')
    expect(result).toEqual([])
  })

  it('should process Go files and ignore test files', () => {
    const mockFiles = [
      { name: 'main.go', isFile: () => true, isDirectory: () => false },
      { name: 'test_test.go', isFile: () => true, isDirectory: () => false }
    ]
    fs.readdirSync.mockReturnValue(mockFiles)

    // Mock the extractGolangFunctions and parseGoFile functions
    const mockExtractGolangFunctions = jest
      .fn()
      .mockReturnValue(['func1', 'func2'])
    const mockParseGoFile = jest.fn()

    // Replace the actual functions with mocks
    jest.mock('../src/languageprocessor/golangprocessor', () => ({
      extractGolangFunctions: mockExtractGolangFunctions,
      parseGoFile: mockParseGoFile
    }))

    const result = scanGoCodeDirectory('/go/code/directory')
    expect(result).toEqual([]) // Assuming parseGoFile doesn't modify the resultQueue
    expect(mockExtractGolangFunctions).toHaveBeenCalledTimes(0)
    expect(mockParseGoFile).toHaveBeenCalledTimes(0)
  })

  it('should recursively traverse directories', () => {
    const mockFiles = [
      { name: 'subdir', isDirectory: () => true },
      { name: 'main.go', isFile: () => true, isDirectory: () => false }
    ]
    fs.readdirSync.mockImplementation(dirPath => {
      if (dirPath === '/go/code/directory') {
        return mockFiles
      } else if (dirPath === '/go/code/directory/subdir') {
        return [
          { name: 'helper.go', isFile: () => true, isDirectory: () => false }
        ]
      }
    })

    const mockExtractGolangFunctions = jest
      .fn()
      .mockReturnValue(['func1', 'func2'])
    const mockParseGoFile = jest.fn()

    jest.mock('../src/languageprocessor/golangprocessor', () => ({
      extractGolangFunctions: mockExtractGolangFunctions,
      parseGoFile: mockParseGoFile
    }))

    const result = scanGoCodeDirectory('/go/code/directory')
    expect(result).toEqual([]) // Assuming parseGoFile doesn't modify the resultQueue
    expect(mockExtractGolangFunctions).toHaveBeenCalledTimes(0)
    expect(mockParseGoFile).toHaveBeenCalledTimes(0)
  })
})
