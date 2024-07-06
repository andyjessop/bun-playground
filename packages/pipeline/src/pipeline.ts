export type Node<I, O> = (input: I) => Promise<O> | O;
export type ConditionalFn<T> = (value: T) => boolean;
export type Operator<I, O> = (input: I) => Promise<O> | O;

export class Pipeline<I, O> {
  private inputNode: Node<I, any> = (i) => i; // defaults to identity function
  private operators: Operator<any, any>[] = [];
  private evaluator: ((result: O) => boolean) | null = null;

  input(node: Node<I, any>): this {
    this.inputNode = node;
    return this;
  }

  pipe(...operators: Operator<any, any>[]): this {
    this.operators.push(...operators);
    return this;
  }

  evaluate(fn: (result: O) => boolean): this {
    this.evaluator = fn;
    return this;
  }

  async run(initialInput: I, options: RunOptions = {}): Promise<O> {
    if (!this.inputNode) {
      throw new Error("Input node is not set");
    }

    const maxRetries = options.maxRetries || 1;

    const runPipe = async (input: any): Promise<O> => {
      let result = await this.inputNode(input);
      for (const operator of this.operators) {
        result = await operator(result);
      }
      return result as O;
    };

    let result = await runPipe(initialInput);
    let retries = 0;

    while (retries < maxRetries && this.evaluator && !this.evaluator(result)) {
      result = await runPipe(result);
      retries++;
    }

    return result;
  }
}


export interface RunOptions {
  maxRetries?: number;
}

// Utility functions
export const conditional = <T>(
  condition: ConditionalFn<T>,
  trueOperator: Operator<T, any>,
  falseOperator: Operator<T, any>
): Operator<T, any> => async (input: T) =>
  condition(input) ? await trueOperator(input) : await falseOperator(input);


export const combine = <T, R>(
  mergeFn: (...results: any[]) => R,
  ...operators: Operator<T, any>[]
): Operator<T, R> => async (input: T) => {
  const results = await Promise.all(operators.map(op => op(input)));
  return mergeFn(...results);
};