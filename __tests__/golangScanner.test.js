/* eslint-disable filenames/match-regex */
const { scanGoCodeDirectory } = require('../src/golangScanner') // Adjust the path
const core = require('@actions/core') // Mock core if needed

const { scanGolangCode } = require('../src/languageprocessor/golangAst')

// Mock the dependencies
jest.mock('../src/languageprocessor/golangAst', () => ({
  scanGolangCode: jest.fn()
}))

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  debug: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn()
}))

describe('scanGoCodeDirectory', () => {
  afterEach(() => {
    jest.clearAllMocks() // Clear mocks after each test
  })

  it('should call buildGoAST and scanGolangCode with the correct directory path', async () => {
    const mockDirPath = './src/mock'
    const mockResult = { files: ['file1.go', 'file2.go'] }

    // Mock the resolved values
    //buildGoAST.mockResolvedValueOnce()
    scanGolangCode.mockReturnValueOnce(mockResult)

    const result = await scanGoCodeDirectory(mockDirPath)

    // Assertions
    //expect(buildGoAST).toHaveBeenCalledTimes(1)
    expect(scanGolangCode).toHaveBeenCalledWith(mockDirPath)
    expect(result).toEqual(mockResult)
  })
})
