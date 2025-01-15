package your_package_name

   import (
       "bytes"
       "fmt"
       "os"

       . "github.com/onsi/ginkgo/v2"
       . "github.com/onsi/gomega"
   )

   var _ = Describe("OuterFunction", func() {
       var buf *bytes.Buffer

       BeforeEach(func() {
           // Redirect standard output to a buffer
           buf = new(bytes.Buffer)
           old := os.Stdout
           os.Stdout = buf
           DeferCleanup(func() {
               os.Stdout = old
           })
       })

       It("should print the outer and inner function messages", func() {
           outerFunction()

           // Capture the output
           output := buf.String()

           // Expected output
           expectedOutput := "This is the outer function.\nThis is the inner function.\n"

           // Assert that the output matches the expected output
           Expect(output).To(Equal(expectedOutput))
       })
   })
   ```

4. **Run the Test**:
   You can run the test using the `go test` command:
   ```bash
   go test