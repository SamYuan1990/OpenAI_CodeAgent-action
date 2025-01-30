/* eslint-disable filenames/match-regex */
const mock = require('mock-fs')
const { scanGoCodeDirectory } = require('../src/golangScanner') // Adjust the path accordingly

describe('scanGoCodeDirectory', () => {
  beforeEach(() => {
    // Mock the file system
    mock({
      '/mock-dir': {
        'file1.go': `
          // Some Go Doc
          func FunctionA() {
              // Function content
          }

          func FunctionB() {
              // Function content
          }
        `,
        'file2_test.go': `
          func TestFunctionA() {
              // Test content
          }
        `,
        subdir: {
          'file3.go': `
            func FunctionC() {
                // Function content
            }
          `
        }
      }
    })
  })

  afterEach(() => {
    // Restore the file system
    mock.restore()
  })

  test('should scan Go files and extract function information', () => {
    const result = scanGoCodeDirectory('/mock-dir')

    expect(result).toEqual([
      {
        currentPath: '/mock-dir',
        fileName: 'file1.go',
        functionName: 'FunctionA',
        content: `func FunctionA() {
// Function content
}`,
        hasGoDoc: true
      },
      {
        currentPath: '/mock-dir',
        fileName: 'file1.go',
        functionName: 'FunctionB',
        content: `func FunctionB() {
// Function content
}`,
        hasGoDoc: false
      },
      {
        currentPath: '/mock-dir/subdir',
        fileName: 'file3.go',
        functionName: 'FunctionC',
        content: `func FunctionC() {
// Function content
}`,
        hasGoDoc: false
      }
    ])
  })

  test('should ignore test files', () => {
    const result = scanGoCodeDirectory('/mock-dir')

    // Ensure that test files are ignored
    expect(result).not.toContainEqual(
      expect.objectContaining({
        fileName: 'file2_test.go'
      })
    )
  })

  test('should handle empty directories', () => {
    mock({
      '/empty-dir': {}
    })

    const result = scanGoCodeDirectory('/empty-dir')
    expect(result).toEqual([])
  })

  test('should handle non-Go files', () => {
    mock({
      '/non-go-dir': {
        'file.txt': 'This is a text file.'
      }
    })

    const result = scanGoCodeDirectory('/non-go-dir')
    expect(result).toEqual([])
  })
})
