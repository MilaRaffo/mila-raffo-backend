import { UUID } from "crypto";
import { RoleName } from '../../roles/entities/role.entity';

export interface JwtPayload {
  sub: UUID;
  email: string;
  role: RoleName;
}
