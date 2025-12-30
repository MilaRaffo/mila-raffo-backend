import { UUID } from "crypto";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: UUID;
    email: string;
    name: string;
    lastName: string;
    role: string;
  };
}
