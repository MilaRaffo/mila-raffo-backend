import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../../roles/entities/role.entity';
import { RESOURCE_ACTIONS_KEY } from '../../auth/guards/resource.guard';

export interface ResourceActionParams {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  allowedRoles?: RoleName[];
}

/**
 * Decorador para definir permisos granulares sobre recursos
 * @param params Parámetros que definen el recurso, acción y roles permitidos
 * 
 * @example
 * @ResourceAction({ resource: 'users', action: 'create', allowedRoles: [RoleName.SUPERADMIN, RoleName.ADMIN] })
 */
export const ResourceAction = (params: ResourceActionParams) =>
  SetMetadata(RESOURCE_ACTIONS_KEY, params);
