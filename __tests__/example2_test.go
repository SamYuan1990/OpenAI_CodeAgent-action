package main

import (
    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
)

var _ = Describe("Add function", func() {
    Context("When adding two positive numbers", func() {
        It("should return the correct sum", func() {
            result := add(2, 3)
            Expect(result).To(Equal(5))
        })
    })

    Context("When adding a positive number and zero", func() {
        It("should return the positive number", func() {
            result := add(5, 0)
            Expect(result).To(Equal(5))
        })
    })

    Context("When adding two negative numbers", func() {
        It("should return the correct sum", func() {
            result := add(-2, -3)
            Expect(result).To(Equal(-5))
        })
    })

    Context("When adding a negative number and a positive number", func() {
        It("should return the correct sum", func() {
            result := add(-2, 3)
            Expect(result).To(Equal(1))
        })
    })

    Context("When adding zero and zero", func() {
        It("should return zero", func() {
            result := add(0, 0)
            Expect(result).To(Equal(0))
        })
    })
})