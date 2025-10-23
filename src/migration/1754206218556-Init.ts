// src/migration/1691200000000-InitCards.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class InitCards1691200000000 implements MigrationInterface {
  name = 'InitCards1691200000000'
  TABLE_NAME = 'card'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)

    queryRunner.createTable(
      new Table({
        name: 'card',
        columns: [{ name: 'id', type: 'string', isNullable: false }],
      }),
    )

    await queryRunner.query(`
      CREATE TYPE "card_side_enum" AS ENUM ('Site', 'Free', 'Shadow', 'The One Ring');
      CREATE TYPE "card_culture_enum" AS ENUM (
        'Shire', 'Gandalf', 'Gondor', 'Dwarven', 'Elven', 'Moria', 'Isengard',
        'Rohan', 'Gollum', 'Wraith', 'Sauron', 'Men', 'Orc', 'Uruk-Hai',
        'Uruk-hai', 'Dunland', 'Raider', 'Man', 'Site', 'The One Ring'
      );
      CREATE TYPE "card_rarity_enum" AS ENUM (
        'P', 'AFD', 'D', 'M', 'SPD', 'W', 'R', 'C', 'U', 'R+', 'S', 'RF', 'O'
      );

      CREATE TABLE "card" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "set" character varying NOT NULL,
        "imagefile" character varying NOT NULL,
        "side" "card_side_enum",
        "culture" "card_culture_enum",
        "type" character varying,
        "twilight_cost" integer,
        "strength" integer,
        "vitality" integer,
        "resistance" integer,
        "signet_or_site" character varying,
        "unique" boolean DEFAULT false,
        "set_number" integer,
        "rarity" "card_rarity_enum",
        "card_number" character varying,
        "notes" text,
        "lore_text" text,
        "game_text" text,
        PRIMARY KEY ("id")
      );
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "card"`)
  }
}
