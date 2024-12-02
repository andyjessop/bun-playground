import { test, expect } from 'bun:test';

// A simple function to test
function add(a: number, b: number): number {
	return a + b;
}

// Test case for the add function
test('adds two numbers together', () => {
	const result = add(2, 3);
	expect(result).toBe(5);
});
