import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategories1791435333885 implements MigrationInterface {
    name = 'AddCategories1791435333885';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "slug" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878"
                    UNIQUE ("name"),
                CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09"
                    UNIQUE ("slug"),
                CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b"
                    PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "products"
            ADD "category_id" uuid
        `);

        await queryRunner.query(`
            INSERT INTO "categories" ("name", "slug")
            VALUES ('Uncategorized', 'uncategorized')
        `);

        await queryRunner.query(`
            UPDATE "products"
            SET "category_id" = (
                SELECT "id"
                FROM "categories"
                WHERE "slug" = 'uncategorized'
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "products"
            ALTER COLUMN "category_id" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "products"
            ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"
            FOREIGN KEY ("category_id")
            REFERENCES "categories"("id")
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "products"
            DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"
        `);

        await queryRunner.query(`
            ALTER TABLE "products"
            DROP COLUMN "category_id"
        `);

        await queryRunner.query(`
            DROP TABLE "categories"
        `);
    }
}
