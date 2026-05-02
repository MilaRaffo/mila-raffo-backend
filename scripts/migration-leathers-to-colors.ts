/**
 * MIGRATION SCRIPT: Rename Leathers to Colors
 * 
 * Execute this script to rename the 'leathers' table to 'colors' in the database.
 * This migration is part of the Color entity refactoring effort.
 * 
 * Usage:
 * 1. Backup your database first
 * 2. Connect to PostgreSQL: psql -U postgres -d mila_raffo_db
 * 3. Run the SQL commands below or execute:
 *    psql -U postgres -d mila_raffo_db -f migration-leathers-to-colors.sql
 */

// SQL Migration Script
export const migrationSQL = `
-- Step 1: Rename the leathers table to colors
ALTER TABLE "leathers" RENAME TO "colors";

-- Step 2: Rename the primary key constraint
ALTER TABLE "colors" RENAME CONSTRAINT "PK_leathers_id" TO "PK_colors_id";

-- Step 3: Rename related indexes (if any)
-- Check and rename indexes if they exist
ALTER INDEX IF EXISTS "IDX_leathers_code" RENAME TO "IDX_colors_code";
ALTER INDEX IF EXISTS "IDX_leathers_created_at" RENAME TO "IDX_colors_created_at";

-- Step 4: Verify the migration
SELECT table_name FROM information_schema.tables WHERE table_name = 'colors';

-- Output: Should show 'colors' in the results if successful
`;

// TypeORM Migration Class (if using migrations)
export const typeormMigrationTemplate = `
import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameLeathersToColors1234567890000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`ALTER TABLE "leathers" RENAME TO "colors"\`);
    await queryRunner.query(
      \`ALTER TABLE "colors" RENAME CONSTRAINT "PK_leathers_id" TO "PK_colors_id"\`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(\`ALTER TABLE "colors" RENAME TO "leathers"\`);
    await queryRunner.query(
      \`ALTER TABLE "leathers" RENAME CONSTRAINT "PK_colors_id" TO "PK_leathers_id"\`
    );
  }
}
`;

// Notes for manual execution
export const migrationNotes = `
MIGRATION NOTES:
================

CHANGES MADE:
1. Renamed entity class from Leather to Color
2. Renamed entity file from leather.entity.ts to color.entity.ts
3. Created new ColorsModule to replace LeathersModule
4. Updated variant relationship from Leather to Color (M:1)
5. Updated all frontend references from Leather to Color

DATABASE MIGRATION:
1. The 'leathers' table needs to be renamed to 'colors'
2. All foreign key constraints and indexes will be automatically updated
3. Data integrity is maintained - all color data is preserved

VERIFICATION STEPS:
1. Check that the 'colors' table exists
2. Verify that variants still have correct color references
3. Test the /colors API endpoint
4. Confirm that variant creation/update with colorId works

ROLLBACK INSTRUCTIONS:
If you need to rollback:
1. Run the DOWN migration or execute reverse SQL
2. Restore backend code to use LeathersModule
3. Update frontend to use LeatherSelector

ESTIMATED EXECUTION TIME:
- For small databases (< 100k rows): < 1 second
- For large databases: < 5 seconds
`;
