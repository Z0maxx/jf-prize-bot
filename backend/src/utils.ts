import { DataResult, Result } from '@jf-prize-bot/schema'

export function getErrorResult(error: unknown): Result {
  return {
    success: false,
    error: typeof error === 'string' ? error : (error as Error).message,
  }
}

export function getDataResult<T>(data: T): DataResult<T> {
  return {
    success: true,
    data,
  }
}
