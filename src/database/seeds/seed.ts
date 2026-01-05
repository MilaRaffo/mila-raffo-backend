import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role, RoleName } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';

export async function seedRolesAndSuperadmin(dataSource: DataSource) {
  const rolesRepository = dataSource.getRepository(Role);
  const usersRepository = dataSource.getRepository(User);

  console.log('🌱 Starting seed...');

  // Create roles if they don't exist
  const rolesToCreate = [
    {
      name: RoleName.CLIENT,
      description: 'Cliente estándar con acceso básico a la aplicación',
    },
    {
      name: RoleName.ADMIN,
      description:
        'Administrador con acceso a la gestión de productos, categorías y clientes',
    },
    {
      name: RoleName.SUPERADMIN,
      description:
        'Super administrador con acceso total al sistema, incluyendo gestión de roles y usuarios admin',
    },
  ];

  console.log('📝 Creating roles...');
  const roles = new Map<RoleName, Role>();

  for (const roleData of rolesToCreate) {
    let role = await rolesRepository.findOne({
      where: { name: roleData.name },
    });

    if (!role) {
      role = rolesRepository.create(roleData);
      await rolesRepository.save(role);
      console.log(`✅ Created role: ${roleData.name}`);
    } else {
      console.log(`ℹ️  Role already exists: ${roleData.name}`);
    }

    roles.set(roleData.name, role);
  }

  // Create superadmin user if it doesn't exist
  console.log('👤 Creating superadmin user...');
  const superadminEmail = process.env.SUPERADMIN_EMAIL || 'superadmin@email.com';
  const superadminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin123!';
  const existingSuperadmin = await usersRepository.findOne({
    where: { email: superadminEmail },
  });

  if (!existingSuperadmin) {
    const superadminRole = roles.get(RoleName.SUPERADMIN)!;
    const hashedPassword = await bcrypt.hash(superadminPassword, 10);

    const superadmin = usersRepository.create({
      name: 'Super',
      lastName: 'Admin',
      email: superadminEmail,
      password: hashedPassword,
      roleId: superadminRole.id,
      isActive: true,
    });

    await usersRepository.save(superadmin);
    console.log('✅ Superadmin created successfully');
    console.log(`   Email: ${superadminEmail}`);
    console.log(`   Password: ${superadminPassword}`);
  } else {
    console.log('ℹ️  Superadmin already exists');
  }

  console.log('🎉 Seed completed successfully!');
}
