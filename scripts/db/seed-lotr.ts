import 'reflect-metadata'
import * as xlsx from 'xlsx'
import { Card, CardSide, CardCulture, CardRarity } from '../../src/entity/Card'
import { AppDataSource } from '../../src/data-source'

const parseBool = (val: any): boolean => val === 'U' || val === true

const toInt = (val: any): number | null => {
  const parsed = parseInt(val)
  return isNaN(parsed) ? null : parsed
}

const parseEnum = <T extends Record<string, string>>(
  val: any,
  enumObj: T,
): T[keyof T] | null => {
  if (val && Object.values(enumObj).includes(val)) {
    return val as T[keyof T]
  } else {
    return null
  }
}

const importCardsFromExcel = async () => {
  const filePath = process.argv[2]

  if (!filePath) {
    console.log('Usage: provide a path to the Excel file')
    process.exit(1)
  }

  await AppDataSource.initialize()
  const cardRepo = AppDataSource.getRepository(Card)
  console.log('✅ Connected to database')

  const workbook = xlsx.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet)

  const cards: Card[] = []

  for (const row of rows) {
    const card = cardRepo.create()

    card.name = row['Name'] || ''
    card.set = row['Set'] || ''
    card.imagefile = row['Imagefile'] || ''
    card.side = parseEnum(row['Side'], CardSide)
    card.culture = parseEnum(row['Culture'], CardCulture)
    card.type = row['Type'] || null
    card.twilight_cost = toInt(row['Twilight'])
    card.strength = toInt(row['Strength'])
    card.vitality = toInt(row['Vitality'])
    card.resistance = toInt(row['Resistance'])
    card.signet_or_site = row['Signet/Site#'] || null
    card.unique = parseBool(row['Unique'])
    card.set_number = toInt(row['Set#'])
    card.rarity = parseEnum(row['Rarity'], CardRarity)
    card.card_number = row['Card#'] || null
    card.notes = row['Notes'] || null
    card.lore_text = row['Lore'] || null
    card.game_text = row['Text'] || null

    cards.push(card)
  }

  // ⚡ Batch insert for performance
  await cardRepo.save(cards)
  console.log(`🎉 Imported ${cards.length} cards`)

  await AppDataSource.destroy()
  console.log('🔌 Database connection closed')
}

importCardsFromExcel().catch(console.error)
