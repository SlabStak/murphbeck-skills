export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
}

export interface ToolParameters {
  type: "object";
  properties: Record<
    string,
    {
      type: string;
      description: string;
      enum?: string[];
    }
  >;
  required?: string[];
}

export abstract class Tool {
  abstract name: string;
  abstract description: string;
  abstract parameters: ToolParameters;

  abstract execute(params: Record<string, unknown>): Promise<ToolResult>;

  protected success(data: unknown): ToolResult {
    return { success: true, data };
  }

  protected error(message: string): ToolResult {
    return { success: false, data: null, error: message };
  }
}
