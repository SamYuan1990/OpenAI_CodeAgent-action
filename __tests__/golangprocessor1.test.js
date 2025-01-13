// fileParser.test.js

const fs = require('fs');
const readline = require('readline');
const { parseFile } = require('./fileParser'); // Assuming the function is exported as `parseFile`

jest.mock('fs');
jest.mock('readline');

describe('parseFile', () => {
  let mockReadStream;
  let mockReadlineInterface;

  beforeEach(() => {
    mockReadStream = {
      on: jest.fn(),
      pipe: jest.fn(),
    };
    mockReadlineInterface = {
      on: jest.fn(),
      close: jest.fn(),
    };

    fs.createReadStream.mockReturnValue(mockReadStream);
    readline.createInterface.mockReturnValue(mockReadlineInterface);
  });

  it('should parse a test file with Describe and It blocks', async () => {
    const filePath = 'testFile.js';
    const isTestFile = true;

    const mockLines = [
      'Describe("Test Suite", () => {',
      '  It("should do something", () => {',
      '    // test code',
      '  })',
      '})',
    ];

    // Mock the line events
    mockReadlineInterface.on.mockImplementation((event, callback) => {
      if (event === 'line') {
        mockLines.forEach(line => callback(line));
      }
    });

    // Mock the close event
    mockReadlineInterface.on.mockImplementationOnce((event, callback) => {
      if (event === 'close') {
        callback();
      }
    });

    const expectedOutput = [
      {
        type: 'testcase',
        describe: 'Test Suite',
        it: 'should do something',
        content: 'It("should do something", () => {\n    // test code\n  })',
      },
    ];

    const result = await parseFile(filePath, isTestFile);
    expect(result).toEqual(expectedOutput);
  });

  it('should parse a regular file with functions', async () => {
    const filePath = 'regularFile.js';
    const isTestFile = false;

    const mockLines = [
      'func myFunction() {',
      '  // function body',
      '}',
    ];

    // Mock the line events
    mockReadlineInterface.on.mockImplementation((event, callback) => {
      if (event === 'line') {
        mockLines.forEach(line => callback(line));
      }
    });

    // Mock the close event
    mockReadlineInterface.on.mockImplementationOnce((event, callback) => {
      if (event === 'close') {
        callback();
      }
    });

    const expectedOutput = [
      {
        type: 'function',
        name: 'myFunction',
        content: 'func myFunction() {\n  // function body\n}',
      },
    ];

    const result = await parseFile(filePath, isTestFile);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle errors during file reading', async () => {
    const filePath = 'errorFile.js';
    const isTestFile = true;

    // Mock the error event
    mockReadlineInterface.on.mockImplementationOnce((event, callback) => {
      if (event === 'error') {
        callback(new Error('File read error'));
      }
    });

    await expect(parseFile(filePath, isTestFile)).rejects.toThrow('File read error');
  });
});