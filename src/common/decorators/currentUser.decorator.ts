import { createParamDecorator, ExecutionContext } from '@nestjs/common';


type UserProfile = {
  email: string;
  name: string;
  id: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Decorator para obter o usuário atual da requisição autenticada
 * Extrai os dados do usuário do request após validação JWT
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserProfile | undefined, ctx: ExecutionContext): UserProfile => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
