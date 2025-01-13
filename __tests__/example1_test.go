package main

import (
    "bytes"
    "fmt"
    "os"

    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
)

var _ = Describe("Greet", func() {
    var buf *bytes.Buffer

    BeforeEach(func() {
        buf = &bytes.Buffer{}
        old := os.Stdout
        os.Stdout = buf
        DeferCleanup(func() {
            os.Stdout = old
        })
    })

    It("should print the correct greeting", func() {
        greet("Alice")
        Expect(buf.String()).To(Equal("Hello, Alice!\n"))
    })

    It("should handle empty name", func() {
        greet("")
        Expect(buf.String()).To(Equal("Hello, !\n"))
    })
})