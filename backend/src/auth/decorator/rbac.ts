import { SetMetadata } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';

export const RBAC = (...roles: Role[]) => SetMetadata('roles', roles);
