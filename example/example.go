// example.go
package main

import "fmt"

// 一个简单的函数
func sayHello() {
	fmt.Println("Hello, World!")
}

// 带参数的函数
func greet(name string) {
	fmt.Printf("Hello, %s!\n", name)
}

// 带返回值的函数
func add(a int, b int) int {
	return a + b
}

// 嵌套函数的情况
func outerFunction() {
	fmt.Println("This is the outer function.")

	// 嵌套函数
	innerFunction := func() {
		fmt.Println("This is the inner function.")
	}

	innerFunction()
}

// 多行函数定义
func multiLineFunction(
	param1 string,
	param2 int,
) string {
	return fmt.Sprintf("Param1: %s, Param2: %d", param1, param2)
}
// Comments below is assisted by Gen AI
// // main is the entry point of the program.
// It calls several functions to demonstrate their usage:
// - sayHello: Prints a greeting message.
// - greet: Greets a specific person by name.
// - add: Adds two integers and returns the result.
// - outerFunction: Calls an inner function to demonstrate nested function usage.
// - multiLineFunction: Demonstrates a function that returns a multi-line string.
func main() {
	sayHello()
	greet("Alice")
	result := add(3, 5)
	fmt.Println("3 + 5 =", result)
	outerFunction()
	output := multiLineFunction("Test", 42)
	fmt.Println(output)
}
