import { UUID } from "crypto";
import { RoleName } from '../../roles/entities/role.entity';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: UUID;
    email: string;
    name: string;
    lastName: string;
    role: {
      id: UUID;
      name: RoleName;
    };
  };
}
