package main

import (
	"testing"
)

// add function to be benchmarked
func add(a, b int) int {
	return a + b
}

// BenchmarkAdd benchmarks the add function
func BenchmarkAdd(b *testing.B) {
	for i := 0; i < b.N; i++ {
		_ = add(3, 5)
	}
}