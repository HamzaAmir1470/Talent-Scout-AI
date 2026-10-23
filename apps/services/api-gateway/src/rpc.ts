import { HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';

export function rpc<T = unknown>(client: ClientProxy, pattern: string, data: unknown): Promise<T> {
  return firstValueFrom(
    client.send<T>(pattern, data).pipe(
      catchError((err) =>
        throwError(() => new HttpException(err?.message ?? 'Service unavailable', err?.status ?? 503)),
      ),
    ),
  );
}
