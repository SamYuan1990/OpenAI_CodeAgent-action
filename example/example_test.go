package main_test

import (
	"fmt"
	. "your-module-path/main" // 替换为你的模块路径

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("Example", func() {
	Describe("add", func() {
		It("should return the sum of two numbers", func() {
			result := add(3, 5)
			Expect(result).To(Equal(8))
		})
	})

	Describe("multiLineFunction", func() {
		It("should return the formatted string", func() {
			result := multiLineFunction("Test", 42)
			Expect(result).To(Equal("Param1: Test, Param2: 42"))
		})
	})
})

func NewHelper() {
	fmt.Println("Helper function")
}
