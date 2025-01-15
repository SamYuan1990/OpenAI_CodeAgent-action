package main

import (
	"fmt"
)

func sayHello() {
	fmt.Println("Hello, World!")
}

func greet(name string) {
	fmt.Printf("Hello, %s!\n", name)
}

func add(a, b int) int {
	return a + b
}

func outerFunction() {
	fmt.Println("This is an outer function.")
}

func multiLineFunction(str string, num int) string {
	return fmt.Sprintf("String: %s, Number: %d", str, num)
}

func main() {
	sayHello()
	greet("Alice")
	result := add(3, 5)
	fmt.Println("3 + 5 =", result)
	outerFunction()
	output := multiLineFunction("Test", 42)
	fmt.Println(output)
},package main_test

   import (
   	. "github.com/onsi/ginkgo/v2"
   	. "github.com/onsi/gomega"
   	"main"
   )

   var _ = Describe("Main", func() {
   	Describe("sayHello", func() {
   		It("should print 'Hello, World!'", func() {
   			Expect(captureOutput(main.sayHello)).To(Equal("Hello, World!\n"))
   		})
   	})

   	Describe("greet", func() {
   		It("should greet the given name", func() {
   			Expect(captureOutput(func() { main.greet("Alice") })).To(Equal("Hello, Alice!\n"))
   		})
   	})

   	Describe("add", func() {
   		It("should return the sum of two numbers", func() {
   			Expect(main.add(3, 5)).To(Equal(8))
   		})
   	})

   	Describe("outerFunction", func() {
   		It("should print 'This is an outer function.'", func() {
   			Expect(captureOutput(main.outerFunction)).To(Equal("This is an outer function.\n"))
   		})
   	})

   	Describe("multiLineFunction", func() {
   		It("should return a formatted string", func() {
   			Expect(main.multiLineFunction("Test", 42)).To(Equal("String: Test, Number: 42"))
   		})
   	})
   })

   // Helper function to capture output from functions that print to stdout
   func captureOutput(f func()) string {
   	old := os.Stdout
   	r, w, _ := os.Pipe()
   	os.Stdout = w

   	f()

   	w.Close()
   	os.Stdout = old

   	var buf bytes.Buffer
   	io.Copy(&buf, r)
   	return buf.String()
   }
   ```

4. **Run the Tests**:

   Run the tests using the following command:

   ```bash
   ginkgo