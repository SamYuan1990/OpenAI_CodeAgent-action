const { scanGoCodeDirectory } = require('../path/to/your/module'); // Adjust the path accordingly
const { buildGoAST, scanGolangCode } = require('../path/to/your/dependencies'); // Mock these dependencies
const core = require('@actions/core'); // Assuming you're using GitHub Actions core module

jest.mock('../path/to/your/dependencies', () => ({
  buildGoAST: jest.fn(),
  scanGolangCode: jest.fn(),
}));

jest.mock('@actions/core', () => ({
  error: jest.fn(),
}));

describe('scanGoCodeDirectory', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should build Go AST and scan the directory successfully', async () => {
    const mockDirPath = '/path/to/go/code';
    const mockResult = { files: ['file1.go', 'file2.go'], issues: [] };

    buildGoAST.mockResolvedValueOnce();
    scanGolangCode.mockReturnValueOnce(mockResult);

    const result = await scanGoCodeDirectory(mockDirPath);

    expect(buildGoAST).toHaveBeenCalledTimes(1);
    expect(scanGolangCode).toHaveBeenCalledWith(mockDirPath);
    expect(result).toEqual(mockResult);
  });

  it('should handle errors and log them using core.error', async () => {
    const mockDirPath = '/path/to/go/code';
    const mockError = new Error('Failed to build AST');

    buildGoAST.mockRejectedValueOnce(mockError);

    await scanGoCodeDirectory(mockDirPath);

    expect(buildGoAST).toHaveBeenCalledTimes(1);
    expect(core.error).toHaveBeenCalledWith('发生错误:', mockError);
  });
});