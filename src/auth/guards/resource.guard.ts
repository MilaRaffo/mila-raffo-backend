import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '../../roles/entities/role.entity';

export const RESOURCE_ACTIONS_KEY = 'resource_actions';

export interface ResourceAction {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  allowedRoles?: RoleName[];
}

/**
 * Guard para controlar permisos granulares sobre recursos específicos
 * Este guard permite definir reglas específicas para cada acción sobre un recurso
 */
@Injectable()
export class ResourceGuard implements CanActivate {
  // Definición de permisos por recurso y acción
  private readonly permissions: Record<string, Record<string, RoleName[]>> = {
    users: {
      create: [RoleName.SUPERADMIN, RoleName.ADMIN],
      read: [RoleName.SUPERADMIN, RoleName.ADMIN],
      update: [RoleName.SUPERADMIN, RoleName.ADMIN],
      delete: [RoleName.SUPERADMIN],
    },
    roles: {
      create: [RoleName.SUPERADMIN],
      read: [RoleName.SUPERADMIN],
      update: [RoleName.SUPERADMIN],
      delete: [RoleName.SUPERADMIN],
    },
    products: {
      create: [RoleName.SUPERADMIN, RoleName.ADMIN],
      read: [RoleName.SUPERADMIN, RoleName.ADMIN, RoleName.CLIENT],
      update: [RoleName.SUPERADMIN, RoleName.ADMIN],
      delete: [RoleName.SUPERADMIN, RoleName.ADMIN],
    },
    categories: {
      create: [RoleName.SUPERADMIN, RoleName.ADMIN],
      read: [RoleName.SUPERADMIN, RoleName.ADMIN, RoleName.CLIENT],
      update: [RoleName.SUPERADMIN, RoleName.ADMIN],
      delete: [RoleName.SUPERADMIN, RoleName.ADMIN],
    },
    variants: {
      create: [RoleName.SUPERADMIN, RoleName.ADMIN],
      read: [RoleName.SUPERADMIN, RoleName.ADMIN, RoleName.CLIENT],
      update: [RoleName.SUPERADMIN, RoleName.ADMIN],
      delete: [RoleName.SUPERADMIN, RoleName.ADMIN],
    },
    characteristics: {
      create: [RoleName.SUPERADMIN, RoleName.ADMIN],
      read: [RoleName.SUPERADMIN, RoleName.ADMIN, RoleName.CLIENT],
      update: [RoleName.SUPERADMIN, RoleName.ADMIN],
      delete: [RoleName.SUPERADMIN, RoleName.ADMIN],
    },
    leathers: {
      create: [RoleName.SUPERADMIN, RoleName.ADMIN],
      read: [RoleName.SUPERADMIN, RoleName.ADMIN, RoleName.CLIENT],
      update: [RoleName.SUPERADMIN, RoleName.ADMIN],
      delete: [RoleName.SUPERADMIN, RoleName.ADMIN],
    },
    images: {
      create: [RoleName.SUPERADMIN, RoleName.ADMIN],
      read: [RoleName.SUPERADMIN, RoleName.ADMIN, RoleName.CLIENT],
      update: [RoleName.SUPERADMIN, RoleName.ADMIN],
      delete: [RoleName.SUPERADMIN, RoleName.ADMIN],
    },
  };

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const resourceAction = this.reflector.getAllAndOverride<ResourceAction>(
      RESOURCE_ACTIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!resourceAction) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRole = user.role.name;

    // Superadmin siempre tiene acceso
    if (userRole === RoleName.SUPERADMIN) {
      return true;
    }

    const { resource, action, allowedRoles } = resourceAction;

    // Si se especifican roles permitidos, usar esos; sino usar los permisos por defecto
    const permittedRoles =
      allowedRoles ||
      this.permissions[resource]?.[action] ||
      [RoleName.SUPERADMIN];

    if (!permittedRoles.includes(userRole)) {
      throw new ForbiddenException(
        `User role '${userRole}' does not have permission to ${action} ${resource}`,
      );
    }

    return true;
  }
}
