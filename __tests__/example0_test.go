package main

import (
    "bytes"
    "fmt"
    "os"

    . "github.com/onsi/ginkgo/v2"
    . "github.com/onsi/gomega"
)

var _ = Describe("SayHello", func() {
    var buf *bytes.Buffer

    BeforeEach(func() {
        // Redirect stdout to a buffer
        buf = new(bytes.Buffer)
        old := os.Stdout
        os.Stdout = buf
        DeferCleanup(func() {
            os.Stdout = old
        })
    })

    It("should print 'Hello, World!'", func() {
        sayHello()
        Expect(buf.String()).To(Equal("Hello, World!\n"))
    })
})