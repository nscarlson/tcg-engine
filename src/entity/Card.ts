// src/entity/Card.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

export enum CardSide {
  Site = 'Site',
  Free = 'Free',
  Shadow = 'Shadow',
  OneRing = 'The One Ring',
}

export enum CardCulture {
  Shire = 'Shire',
  Gandalf = 'Gandalf',
  Gondor = 'Gondor',
  Dwarven = 'Dwarven',
  Elven = 'Elven',
  Moria = 'Moria',
  Isengard = 'Isengard',
  Rohan = 'Rohan',
  Gollum = 'Gollum',
  Wraith = 'Wraith',
  Sauron = 'Sauron',
  Men = 'Men',
  Orc = 'Orc',
  UrukHai = 'Uruk-Hai',
  Urukhai = 'Uruk-hai',
  Dunland = 'Dunland',
  Raider = 'Raider',
  Man = 'Man',
  Site = 'Site',
  OneRing = 'The One Ring',
}

export enum CardRarity {
  P = 'P',
  AFD = 'AFD',
  D = 'D',
  M = 'M',
  SPD = 'SPD',
  W = 'W',
  R = 'R',
  C = 'C',
  U = 'U',
  RPlus = 'R+',
  S = 'S',
  RF = 'RF',
  O = 'O',
}

@Entity()
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  set: string

  @Column()
  imagefile: string

  @Column({ type: 'enum', enum: CardSide, nullable: true })
  side: CardSide | null

  @Column({ type: 'enum', enum: CardCulture, nullable: true })
  culture: CardCulture | null

  @Column({ type: 'varchar', nullable: true })
  type: string | null

  @Column({ type: 'int', nullable: true })
  twilight_cost: number | null

  @Column({ type: 'int', nullable: true })
  strength: number | null

  @Column({ type: 'int', nullable: true })
  vitality: number | null

  @Column({ type: 'int', nullable: true })
  resistance: number | null

  @Column({ type: 'varchar', nullable: true })
  signet_or_site: string | null

  @Column({ default: false })
  unique: boolean

  @Column({ type: 'int', nullable: true })
  set_number: number | null

  @Column({ type: 'enum', enum: CardRarity, nullable: true })
  rarity: CardRarity | null

  @Column({ type: 'varchar', nullable: true })
  card_number: string | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'text', nullable: true })
  lore_text: string | null

  @Column({ type: 'text', nullable: true })
  game_text: string | null
}
