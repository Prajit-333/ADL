import { z } from 'zod';

const UserRoleEnum = z.enum([
  'SUPER_ADMIN',
  'COLLEGE_ADMIN',
  'TRANSPORT_ADMIN',
  'DRIVER',
  'STUDENT',
  'PARENT',
  'STAFF'
]);

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2),
    role: UserRoleEnum,
    collegeId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }).refine((data) => {
    if (data.role !== 'SUPER_ADMIN' && !data.collegeId) {
      return false;
    }
    return true;
  }, {
    message: "collegeId is required for roles other than SUPER_ADMIN",
    path: ["collegeId"]
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    name: z.string().min(2).optional(),
    role: UserRoleEnum.optional(),
    collegeId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
