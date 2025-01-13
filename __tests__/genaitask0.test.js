const fs = require('fs');
const { generateGenAItaskQueue } = require('./path-to-your-function-file');
const core = require('@actions/core');
const { extractGolangFunctions, extractAllFunctions, parseFileToAST } = require('./path-to-your-dependencies');

// Mocking dependencies
jest.mock('fs');
jest.mock('@actions/core');
jest.mock('./path-to-your-dependencies', () => ({
  extractGolangFunctions: jest.fn(),
  extractAllFunctions: jest.fn(),
  parseFileToAST: jest.fn(),
}));

describe('generateGenAItaskQueue', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods:
    jest.clearAllMocks();
  });

  it('should process a task with inputFileProcessMethod "by_function" and .go file', async () => {
    const task = {
      id: 'task1',
      inputFilePath: 'example_test.go',
      outputProcessMethod: 'method1',
      prompt: 'prompt1',
      inputFileProcessMethod: 'by_function',
      outputFilePath: 'output_{{index}}.go',
    };

    const mockFunctions = [
      { name: 'func1', content: 'content1' },
      { name: 'func2', content: 'content2' },
    ];

    extractGolangFunctions.mockResolvedValue(mockFunctions);

    const result = await generateGenAItaskQueue(task);

    expect(core.info).toHaveBeenCalledWith(task.id);
    expect(core.info).toHaveBeenCalledWith(task.inputFilePath);
    expect(core.info).toHaveBeenCalledWith(task.outputProcessMethod);
    expect(core.info).toHaveBeenCalledWith(task.prompt);
    expect(core.info).toHaveBeenCalledWith(task.inputFileProcessMethod);

    expect(extractGolangFunctions).toHaveBeenCalledWith(task.inputFilePath, true);
    expect(result).toEqual([
      {
        id: 'task10',
        prompt: 'prompt1',
        content: 'content1',
        outputProcessMethod: 'method1',
        outputFilePath: 'output_0.go',
        code_language: 'go',
      },
      {
        id: 'task11',
        prompt: 'prompt1',
        content: 'content2',
        outputProcessMethod: 'method1',
        outputFilePath: 'output_1.go',
        code_language: 'go',
      },
    ]);
  });

  it('should process a task with inputFileProcessMethod "by_function" and non .go file', async () => {
    const task = {
      id: 'task1',
      inputFilePath: 'example.js',
      outputProcessMethod: 'method1',
      prompt: 'prompt1',
      inputFileProcessMethod: 'by_function',
      outputFilePath: 'output_{{index}}.js',
    };

    const mockFunctions = [
      { name: 'func1', content: 'content1' },
      { name: 'func2', content: 'content2' },
    ];

    fs.readFileSync.mockReturnValue('mockCode');
    parseFileToAST.mockReturnValue('mockAST');
    extractAllFunctions.mockReturnValue(mockFunctions);

    const result = await generateGenAItaskQueue(task);

    expect(core.info).toHaveBeenCalledWith(task.id);
    expect(core.info).toHaveBeenCalledWith(task.inputFilePath);
    expect(core.info).toHaveBeenCalledWith(task.outputProcessMethod);
    expect(core.info).toHaveBeenCalledWith(task.prompt);
    expect(core.info).toHaveBeenCalledWith(task.inputFileProcessMethod);

    expect(fs.readFileSync).toHaveBeenCalledWith(task.inputFilePath, 'utf8');
    expect(parseFileToAST).toHaveBeenCalledWith(task.inputFilePath);
    expect(extractAllFunctions).toHaveBeenCalledWith('mockAST', 'mockCode');
    expect(result).toEqual([
      {
        id: 'task10',
        prompt: 'prompt1',
        content: 'content1',
        outputProcessMethod: 'method1',
        outputFilePath: 'output_0.js',
        code_language: 'js',
      },
      {
        id: 'task11',
        prompt: 'prompt1',
        content: 'content2',
        outputProcessMethod: 'method1',
        outputFilePath: 'output_1.js',
        code_language: 'js',
      },
    ]);
  });

  it('should handle empty function list', async () => {
    const task = {
      id: 'task1',
      inputFilePath: 'example.js',
      outputProcessMethod: 'method1',
      prompt: 'prompt1',
      inputFileProcessMethod: 'by_function',
      outputFilePath: 'output_{{index}}.js',
    };

    fs.readFileSync.mockReturnValue('mockCode');
    parseFileToAST.mockReturnValue('mockAST');
    extractAllFunctions.mockReturnValue([]);

    const result = await generateGenAItaskQueue(task);

    expect(result).toEqual([]);
  });

  it('should handle non "by_function" inputFileProcessMethod', async () => {
    const task = {
      id: 'task1',
      inputFilePath: 'example.js',
      outputProcessMethod: 'method1',
      prompt: 'prompt1',
      inputFileProcessMethod: 'other_method',
      outputFilePath: 'output_{{index}}.js',
    };

    const result = await generateGenAItaskQueue(task);

    expect(result).toEqual([]);
  });
});