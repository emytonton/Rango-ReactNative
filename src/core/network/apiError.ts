export type ApiFieldError = {
  field: string;
  message: string;
};

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: ApiFieldError[];
  };
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(readonly cause?: unknown) {
    super('Não foi possível conectar ao servidor.');
    this.name = 'NetworkError';
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  let body: ApiErrorEnvelope['error'];
  try {
    body = ((await response.json()) as ApiErrorEnvelope).error;
  } catch {
    body = undefined;
  }
  return new ApiError(
    response.status,
    body?.code ?? `HTTP_${response.status}`,
    body?.message ?? 'Erro inesperado. Tente novamente.',
    body?.details ?? [],
  );
}
