import { Tool, type ToolResult, type ToolParameters } from "./base";

export class CalculatorTool extends Tool {
  name = "calculator";
  description =
    "Perform mathematical calculations. Supports basic arithmetic, exponents, and common math functions.";

  parameters: ToolParameters = {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description:
          "The mathematical expression to evaluate (e.g., '2 + 2', '10 * 5', 'Math.sqrt(16)')",
      },
    },
    required: ["expression"],
  };

  async execute(params: { expression: string }): Promise<ToolResult> {
    try {
      // Sanitize the expression to only allow safe math operations
      const sanitized = params.expression.replace(
        /[^0-9+\-*/().%\s]|(?<![a-zA-Z])Math\.[a-z]+/gi,
        (match) => {
          const allowedFunctions = [
            "Math.abs",
            "Math.ceil",
            "Math.floor",
            "Math.round",
            "Math.sqrt",
            "Math.pow",
            "Math.min",
            "Math.max",
            "Math.sin",
            "Math.cos",
            "Math.tan",
            "Math.log",
            "Math.exp",
            "Math.PI",
            "Math.E",
          ];
          if (allowedFunctions.some((fn) => match.startsWith(fn))) {
            return match;
          }
          return "";
        }
      );

      // Evaluate the expression
      const result = Function(`"use strict"; return (${sanitized})`)();

      if (typeof result !== "number" || !isFinite(result)) {
        return this.error("Invalid result: not a finite number");
      }

      return this.success({
        expression: params.expression,
        result,
      });
    } catch (error) {
      return this.error(
        `Failed to evaluate expression: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
