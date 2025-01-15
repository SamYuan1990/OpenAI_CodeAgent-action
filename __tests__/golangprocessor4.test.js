const errorHandler = err => {
  reject(err);
};,describe('errorHandler', () => {
  it('should call reject with the provided error', () => {
    // Mock the reject function
    const reject = jest.fn();

    // Create a sample error
    const sampleError = new Error('Something went wrong');

    // Call the errorHandler function with the sample error
    errorHandler(sampleError);

    // Assert that reject was called with the sample error
    expect(reject).toHaveBeenCalledWith(sampleError);
  });
});