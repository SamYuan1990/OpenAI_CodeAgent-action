package main

import (
	"testing"
)

// Assuming multiLineFunction is defined elsewhere in your code
func multiLineFunction(param1 string, param2 int) string {
	return fmt.Sprintf("Param1: %s, Param2: %d", param1, param2)
}

func BenchmarkMultiLineFunction(b *testing.B) {
	// Run the function b.N times
	for i := 0; i < b.N; i++ {
		_ = multiLineFunction("Test", 42)
	}
}