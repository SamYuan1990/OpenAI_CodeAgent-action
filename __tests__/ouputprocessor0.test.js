const { processOutput } = require('./path/to/your/module'); // Adjust the path accordingly
const core = require('@actions/core');
const { writeFileForAarray } = require('./path/to/your/module'); // Adjust the path accordingly

// Mock the core module
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

// Mock the writeFileForAarray function
jest.mock('./path/to/your/module', () => ({
  writeFileForAarray: jest.fn(),
}));

describe('processOutput', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should process output with regex_match for JavaScript', () => {
    // Arrange
    const dataFromAIAgent = 'Some JavaScript code with console.log("Hello, World!");';
    const GenAItask = {
      code_language: 'javascript',
      outputProcessMethod: 'regex_match',
      outputFilePath: 'output.js',
    };
    const js_regex = /console\.log\(.*?\);/g;
    const js_replacer = 'console.log(';
    core.getInput.mockReturnValue('false');

    // Act
    processOutput(dataFromAIAgent, GenAItask);

    // Assert
    expect(core.getInput).toHaveBeenCalledWith('fileOverWrite', { required: true });
    expect(core.info).toHaveBeenCalledWith(['"Hello, World!");']);
    expect(core.debug).toHaveBeenCalledWith('content:', ['"Hello, World!");']);
    expect(writeFileForAarray).not.toHaveBeenCalled();
  });

  it('should process output with regex_match for Go', () => {
    // Arrange
    const dataFromAIAgent = 'Some Go code with fmt.Println("Hello, World!")';
    const GenAItask = {
      code_language: 'go',
      outputProcessMethod: 'regex_match',
      outputFilePath: 'output.go',
    };
    const golang_regex = /fmt\.Println\(.*?\)/g;
    const golang_replacer = 'fmt.Println(';
    core.getInput.mockReturnValue('true');

    // Act
    processOutput(dataFromAIAgent, GenAItask);

    // Assert
    expect(core.getInput).toHaveBeenCalledWith('fileOverWrite', { required: true });
    expect(writeFileForAarray).toHaveBeenCalledWith('output.go', ['"Hello, World!")']);
    expect(core.debug).toHaveBeenCalledWith('content:', ['"Hello, World!")']);
    expect(core.info).not.toHaveBeenCalled();
  });

  it('should handle content not found', () => {
    // Arrange
    const dataFromAIAgent = 'Some code without matches';
    const GenAItask = {
      code_language: 'javascript',
      outputProcessMethod: 'regex_match',
      outputFilePath: 'output.js',
    };
    core.getInput.mockReturnValue('false');

    // Act
    processOutput(dataFromAIAgent, GenAItask);

    // Assert
    expect(core.getInput).toHaveBeenCalledWith('fileOverWrite', { required: true });
    expect(core.info).toHaveBeenCalledWith('content not found');
    expect(writeFileForAarray).not.toHaveBeenCalled();
    expect(core.debug).not.toHaveBeenCalled();
  });
});