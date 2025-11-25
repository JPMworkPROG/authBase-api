import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../types/authenticated-user.type';

/**
 * Guard para autorização baseada em papéis (roles)
 * Verifica se o usuário autenticado possui um dos papéis necessários
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      this.logger.debug(`No roles required for: ${method} ${url}`);
      return true;
    }

    const { user }: { user?: AuthenticatedUser } = request;

    if (!user) {
      this.logger.warn(`Role check failed: No user found - ${method} ${url}`);
      return false;
    }

    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    
    if (hasRequiredRole) {
      this.logger.debug(`Role check passed: User ${user.id} has required role - ${method} ${url}`);
    } else {
      this.logger.warn(`Role check failed: User ${user.id} (${user.role}) does not have required roles [${requiredRoles.join(', ')}] - ${method} ${url}`);
    }

    return hasRequiredRole;
  }
}
