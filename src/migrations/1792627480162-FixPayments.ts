import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPayments1792627480162 implements MigrationInterface {
    name = 'FixPayments1792627480162'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_payments_one_active_per_order" ON "payments"  ("order_id") WHERE "status" IN ('pending', 'succeeded')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_payments_one_active_per_order"`);
    }

}
