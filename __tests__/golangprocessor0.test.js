const fs = require('fs');
const readline = require('readline');
const { extractGolangFunctions } = require('./path/to/your/module'); // Adjust the path accordingly

// Mock fs and readline
jest.mock('fs');
jest.mock('readline');

describe('extractGolangFunctions', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    fs.createReadStream.mockClear();
    readline.createInterface.mockClear();
  });

  it('should extract functions from a Go file', async () => {
    const mockFilePath = '/path/to/go/file.go';
    const mockFileContent = [
      'package main',
      '',
      'func main() {',
      '    fmt.Println("Hello, World!")',
      '}',
      '',
      'func add(a, b int) int {',
      '    return a + b',
      '}',
      ''
    ].join('\n');

    // Mock fs.createReadStream to return a readable stream
    const mockStream = {
      on: jest.fn().mockImplementation(function(event, handler) {
        if (event === 'data') {
          handler(mockFileContent);
        }
        if (event === 'end') {
          handler();
        }
        return this;
      })
    };
    fs.createReadStream.mockReturnValue(mockStream);

    // Mock readline.createInterface to simulate reading lines
    const mockRl = {
      on: jest.fn().mockImplementation(function(event, handler) {
        if (event === 'line') {
          mockFileContent.split('\n').forEach(line => handler(line));
        }
        if (event === 'close') {
          handler();
        }
        return this;
      })
    };
    readline.createInterface.mockReturnValue(mockRl);

    const result = await extractGolangFunctions(mockFilePath);

    expect(result).toEqual([
      {
        type: 'function',
        name: 'main',
        content: 'func main() {\n    fmt.Println("Hello, World!")\n}'
      },
      {
        type: 'function',
        name: 'add',
        content: 'func add(a, b int) int {\n    return a + b\n}'
      }
    ]);
  });

  it('should extract test cases from a Go test file', async () => {
    const mockFilePath = '/path/to/go/testfile_test.go';
    const mockFileContent = [
      'package main',
      '',
      'import "github.com/onsi/ginkgo"',
      '',
      'Describe("MyFeature", func() {',
      '    It("should do something", func() {',
      '        // Test code here',
      '    })',
      '})',
      ''
    ].join('\n');

    // Mock fs.createReadStream to return a readable stream
    const mockStream = {
      on: jest.fn().mockImplementation(function(event, handler) {
        if (event === 'data') {
          handler(mockFileContent);
        }
        if (event === 'end') {
          handler();
        }
        return this;
      })
    };
    fs.createReadStream.mockReturnValue(mockStream);

    // Mock readline.createInterface to simulate reading lines
    const mockRl = {
      on: jest.fn().mockImplementation(function(event, handler) {
        if (event === 'line') {
          mockFileContent.split('\n').forEach(line => handler(line));
        }
        if (event === 'close') {
          handler();
        }
        return this;
      })
    };
    readline.createInterface.mockReturnValue(mockRl);

    const result = await extractGolangFunctions(mockFilePath, true);

    expect(result).toEqual([
      {
        type: 'testcase',
        describe: 'MyFeature',
        it: 'should do something',
        content: '// Test code here'
      }
    ]);
  });

  it('should handle errors when reading the file', async () => {
    const mockFilePath = '/path/to/nonexistent/file.go';

    // Mock fs.createReadStream to simulate an error
    const mockError = new Error('File not found');
    fs.createReadStream.mockImplementation(() => {
      throw mockError;
    });

    await expect(extractGolangFunctions(mockFilePath)).rejects.toThrow('File not found');
  });
});