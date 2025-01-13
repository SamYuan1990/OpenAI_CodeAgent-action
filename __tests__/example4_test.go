package your_package_name

import (
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

var _ = Describe("multiLineFunction", func() {
	Context("when the function is called with valid parameters", func() {
		It("should return the correct formatted string", func() {
			param1 := "test"
			param2 := 123

			result := multiLineFunction(param1, param2)

			expectedResult := "Param1: test, Param2: 123"
			Expect(result).To(Equal(expectedResult))
		})
	})

	Context("when the function is called with empty string", func() {
		It("should return the correct formatted string with empty param1", func() {
			param1 := ""
			param2 := 456

			result := multiLineFunction(param1, param2)

			expectedResult := "Param1: , Param2: 456"
			Expect(result).To(Equal(expectedResult))
		})
	})

	Context("when the function is called with zero value for param2", func() {
		It("should return the correct formatted string with zero param2", func() {
			param1 := "zero"
			param2 := 0

			result := multiLineFunction(param1, param2)

			expectedResult := "Param1: zero, Param2: 0"
			Expect(result).To(Equal(expectedResult))
		})
	})
})