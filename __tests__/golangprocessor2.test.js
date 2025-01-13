const processLine = require('./pathToYourFunctionFile'); // Adjust the path accordingly

describe('processLine function', () => {
  let functions;
  let isTestFile;
  let inDescribe, inIt, inFunction;
  let describeName, itName, functionName, functionBody;

  beforeEach(() => {
    functions = [];
    isTestFile = false;
    inDescribe = inIt = inFunction = false;
    describeName = itName = functionName = functionBody = '';
  });

  test('should handle non-test file lines and extract functions', () => {
    isTestFile = false;
    processLine('func exampleFunc() {');
    processLine('  console.log("Hello, world!");');
    processLine('}');

    expect(functions).toEqual([
      {
        type: 'function',
        name: 'exampleFunc',
        content: 'func exampleFunc() {\n  console.log("Hello, world!");\n}'
      }
    ]);
  });

  test('should handle test file lines and extract Describe and It blocks', () => {
    isTestFile = true;
    processLine('Describe("Example Describe", () => {');
    processLine('  It("should do something", () => {');
    processLine('    expect(true).toBe(true);');
    processLine('  })');
    processLine('})');

    expect(functions).toEqual([
      {
        type: 'testcase',
        describe: 'Example Describe',
        it: 'should do something',
        content: 'It("should do something", () => {\n    expect(true).toBe(true);\n  })'
      }
    ]);
  });

  test('should handle nested Describe and It blocks correctly', () => {
    isTestFile = true;
    processLine('Describe("Outer Describe", () => {');
    processLine('  Describe("Inner Describe", () => {');
    processLine('    It("should do something inner", () => {');
    processLine('      expect(true).toBe(true);');
    processLine('    })');
    processLine('  })');
    processLine('})');

    expect(functions).toEqual([
      {
        type: 'testcase',
        describe: 'Inner Describe',
        it: 'should do something inner',
        content: 'It("should do something inner", () => {\n      expect(true).toBe(true);\n    })'
      }
    ]);
  });

  test('should reset state correctly after processing a function or test case', () => {
    isTestFile = true;
    processLine('Describe("Example Describe", () => {');
    processLine('  It("should do something", () => {');
    processLine('    expect(true).toBe(true);');
    processLine('  })');
    processLine('})');
    processLine('Describe("Another Describe", () => {');
    processLine('  It("should do another thing", () => {');
    processLine('    expect(false).toBe(false);');
    processLine('  })');
    processLine('})');

    expect(functions).toEqual([
      {
        type: 'testcase',
        describe: 'Example Describe',
        it: 'should do something',
        content: 'It("should do something", () => {\n    expect(true).toBe(true);\n  })'
      },
      {
        type: 'testcase',
        describe: 'Another Describe',
        it: 'should do another thing',
        content: 'It("should do another thing", () => {\n    expect(false).toBe(false);\n  })'
      }
    ]);
  });
});