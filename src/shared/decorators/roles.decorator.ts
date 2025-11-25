import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';

/**
 * Decorator para definir os papéis necessários para acessar uma rota
 * Usado em conjunto com RolesGuard para autorização baseada em papéis
 */
export const Roles = (...roles: ('USER' | 'ADMIN')[]) => SetMetadata(ROLES_KEY, roles);
