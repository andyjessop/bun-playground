import { expect, test, describe, mock } from "bun:test";
import { Pipeline, conditional, combine, type Node, type Operator, type ConditionalFn } from "./pipeline";

describe("Pipeline", () => {
  test("input method", () => {
    const pipeline = new Pipeline<number, number>();
    const inputNode: Node<number, number> = (input) => input * 2;
    const result = pipeline.input(inputNode);
    expect(result).toBe(pipeline);
  });

  test("pipe method", () => {
    const pipeline = new Pipeline<number, number>();
    const op1: Operator<number, number> = (input) => input + 1;
    const op2: Operator<number, number> = (input) => input * 2;
    const result = pipeline.pipe(op1, op2);
    expect(result).toBe(pipeline);
  });

  test("run method - basic", async () => {
    const pipeline = new Pipeline<number, number>()
      .input((input) => input * 2)
      .pipe((input) => input + 1);

    const result = await pipeline.run(5);
    expect(result).toBe(11);
  });

  test("run method - with evaluate", async () => {
    const pipeline = new Pipeline<number, number>()
      .input((input) => input)
      .pipe((input) => input + 1)
      .evaluate((output) => output >= 4);
  
    const result = await pipeline.run(1, { maxRetries: 3 });
    expect(result).toBe(4);
  });

  test("run method - max retries reached", async () => {
    let counter = 0;
    const pipeline = new Pipeline<number, number>()
      .input((input) => {
        counter++;
        return input;
      })
      .pipe((input) => input)
      .evaluate(() => false);
  
    const result = await pipeline.run(2, { maxRetries: 5 });
    expect(result).toBe(2);
    expect(counter).toBe(6); // Initial run + 5 retries
  });

  test("run method - async operators", async () => {
    const asyncOp: Operator<number, number> = async (input) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return input * 2;
    };
    const pipeline = new Pipeline<number, number>()
      .input(asyncOp)
      .pipe(asyncOp);
    const result = await pipeline.run(3);
    expect(result).toBe(12);
  });
});

describe("Utility Functions", () => {
  test("conditional - true case", async () => {
    const condition: ConditionalFn<number> = (value) => value > 5;
    const trueOp: Operator<number, string> = (value) => `${value} is greater than 5`;
    const falseOp: Operator<number, string> = (value) => `${value} is not greater than 5`;
    const conditionalOp = conditional(condition, trueOp, falseOp);
    const result = await conditionalOp(10);
    expect(result).toBe("10 is greater than 5");
  });

  test("conditional - false case", async () => {
    const condition: ConditionalFn<number> = (value) => value > 5;
    const trueOp: Operator<number, string> = (value) => `${value} is greater than 5`;
    const falseOp: Operator<number, string> = (value) => `${value} is not greater than 5`;
    const conditionalOp = conditional(condition, trueOp, falseOp);
    const result = await conditionalOp(3);
    expect(result).toBe("3 is not greater than 5");
  });

  test("combine", async () => {
    const op1: Operator<number, number> = (value) => value * 2;
    const op2: Operator<number, number> = (value) => value + 1;
    const mergeFn = (a: number, b: number) => a + b;
    const combinedOp = combine(mergeFn, op1, op2);
    const result = await combinedOp(5);
    expect(result).toBe(16); // (5 * 2) + (5 + 1) = 10 + 6 = 16
  });

  test("combine with async operators", async () => {
    const asyncOp1: Operator<number, number> = async (value) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return value * 2;
    };
    const asyncOp2: Operator<number, number> = async (value) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return value + 1;
    };
    const mergeFn = (a: number, b: number) => a + b;
    const combinedOp = combine(mergeFn, asyncOp1, asyncOp2);
    const result = await combinedOp(5);
    expect(result).toBe(16);
  });
});

describe("Integration Tests", () => {
  test("complex pipeline with all features - case 1", async () => {
    const pipeline = new Pipeline<number, string>()
      .input((num) => num * 2)
      .pipe(
        (value) => value.toString(),
        conditional(
          (value) => value.length > 2,
          (value) => value + "!",
          (value) => value + "?"
        ),
        combine(
          (a, b) => a + b,
          (value) => value.toUpperCase(),
          (value) => value.toLowerCase()
        )
      )
      .evaluate((output) => output.length >= 5);
  
    const result = await pipeline.run(5, { maxRetries: 1 });
  
    expect(result).toBe("10?10?");
  });

  test("complex pipeline with all features - case 2", async () => {
    const pipeline = new Pipeline<number, string>()
      .input((num) => num * 2)
      .pipe(
        (value) => value.toString(),
        conditional(
          (value) => value.length === 2,
          (value) => value + "!",
          (value) => value + "?"
        ),
        combine(
          (a, b) => a + b,
          (value) => value.toUpperCase(),
          (value) => value.toLowerCase()
        )
      )
      .evaluate((output) => output.length >= 5);
  
    const result = await pipeline.run(5, { maxRetries: 1 });
  
    expect(result).toBe("10!10!");
  });

  test("error handling", async () => {
    const errorPipeline = new Pipeline<number, number>()
      .input((input) => {
        if (input < 0) throw new Error("Input must be non-negative");
        return input * 2;
      });

    await expect(errorPipeline.run(-5)).rejects.toThrow("Input must be non-negative");
  });
});
