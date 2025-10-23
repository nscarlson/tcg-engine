import path from 'path'
import os from 'os'
import { promises as fs } from 'fs'
import fg from 'fast-glob'
import sharp from 'sharp'
import pMap from 'p-map'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// Command-line arguments
const argv = yargs(hideBin(process.argv))
  .option('input', {
    type: 'string',
    alias: 'i',
    description: 'Input directory',
  })
  .demandOption('input', 'Please specify an input directory with -i or --input')
  .option('concurrency', {
    type: 'number',
    alias: 'c',
    description: 'Parallel jobs (default: cpuCount-1)',
  })
  .option('output', {
    type: 'string',
    alias: 'o',
    description: 'Output directory',
    default: 'normalized',
  })
  .help()
  .parseSync()

// Initialize command-line arguments
const inputDir = String(argv.input)

// number of cpus or 4 as fallback
const cpuCount = os.cpus()?.length ?? 4

// number of CPUs minus one, minimum 1
const defaultConcurrency = Math.max(1, cpuCount - 1)

const concurrency =
  argv.concurrency && argv.concurrency > 0
    ? Math.floor(argv.concurrency)
    : defaultConcurrency
const outputDir = path.resolve(process.cwd(), String(argv.output))

sharp.concurrency(concurrency)
sharp.cache({ items: Math.max(10, concurrency * 2) })

async function ensureDirectoryExists(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
}

// Process a single file
async function processFile(file: string, inputDir: string) {
  try {
    console.log('processFile:', file)

    const imageSharp = sharp(file)
    const meta = await imageSharp.metadata()

    if (!meta.height) {
      console.log('skip (no height info):', file)
      return
    }

    const relativeToInput = path.relative(inputDir, file)
    const outPath = path.join(outputDir, relativeToInput)
    await ensureDirectoryExists(outPath)

    // If image is "close enough" to 500px, don't resize — copy the file instead.
    // This keeps the original pixels and avoids extra resampling.
    const tolerance = 5 // +/- tolerance around 500

    if (meta.height <= 500 - tolerance || meta.height >= 500 + tolerance) {
      const tmpPath = `${outPath}.tmp-${process.pid}-${Date.now()}`
      await fs.copyFile(file, tmpPath) // write complete copy to tmp
      await fs.rename(tmpPath, outPath) // atomic replace
      console.log(
        'copied (no resize):',
        outPath,
        `(${meta.width}x${meta.height})`,
      )
      return
    }

    // Otherwise resize to 500px height (preserve aspect ratio)
    const pipeline = imageSharp
      .resize({ height: 500, kernel: 'lanczos3' })
      .withMetadata()
      .sharpen()

    const result = await pipeline
      .jpeg({ quality: 96, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toBuffer({ resolveWithObject: true })

    const buffer = result.data
    const info = result.info

    const tmpPath = `${outPath}.tmp-${process.pid}-${Date.now()}`
    await fs.writeFile(tmpPath, buffer)
    await fs.rename(tmpPath, outPath)

    console.log(
      'resized:',
      file,
      '->',
      outPath,
      `(${info.width}x${info.height})`,
    )
  } catch (err) {
    console.error('error processing', file, err)
  }
}

// Main execution
async function main(): Promise<void> {
  const baseDir = path.resolve(inputDir)

  // glob for only jpg/jpeg files
  const patterns = ['**/*.{jpg,jpeg}']

  // now find matching files based on glob
  const entries = await fg(patterns, {
    cwd: baseDir,
    absolute: true,
    onlyFiles: true,
  })

  // Prepare output directory if not inplace
  await fs.mkdir(outputDir, { recursive: true })
  console.log('Writing resized images to:', outputDir)
  console.log(`Using concurrency=${concurrency} (cpus=${cpuCount})`)

  // Process files in parallel
  await pMap(entries, (f) => processFile(f, baseDir), {
    concurrency: concurrency,
  })

  console.log('Done. Processed', entries.length, 'files.')
}

// Run the main function
main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
