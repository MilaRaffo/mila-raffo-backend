import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RoleName } from '../../roles/entities/role.entity';

/**
 * Guard para prevenir que admins creen, actualicen o eliminen otros admins o superadmins
 * Solo el superadmin puede gestionar otros admins y superadmins
 */
@Injectable()
export class AdminUserManagementGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const currentUser = request.user;

    if (!currentUser || !currentUser.role) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRole = currentUser.role.name;

    // Superadmin puede hacer todo
    if (userRole === RoleName.SUPERADMIN) {
      return true;
    }

    // Para admins, verificar el roleId en el body o params
    if (userRole === RoleName.ADMIN) {
      const body = request.body;
      const targetUserId = request.params?.id;

      // Si hay un roleId en el body (crear o actualizar)
      if (body && body.roleId) {
        throw new ForbiddenException(
          'Admins cannot assign roles. Only clients can be created or updated.',
        );
      }

      // Para operaciones de actualización/eliminación, verificar el usuario objetivo
      // Esto se manejará en el servicio para verificar el rol del usuario objetivo

      return true;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}
