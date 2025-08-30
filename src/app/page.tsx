"use client"

import { useEffect, useRef, useState } from "react"
import Card from "../components/card"

const cardSets = [
    {
        name: "Fellowship of the Ring",
        count: 365,
    },
    {
        name: "Mines of Moria",
        count: 122,
    },
    {
        name: "Realms of the Elf Lords",
        count: 122,
    },
    {
        name: "Two Towers",
        count: 365,
    },
    {
        name: "Battle of Helm's Deep",
        count: 128,
    },
    {
        name: "Ents of Fangorn",
        count: 128,
    },
    {
        name: "Return of the King",
        count: 365,
    },
    {
        name: "Siege of Gondor",
        count: 122,
    },
    {
        name: "Reflections",
        count: 52,
    },
    {
        name: "Mount Doom",
        count: 122, // This set is not available in the original code, but added for completeness
    },
]

interface GridProps {
    cardIds: string[]
    groupDuplicates: boolean
}
// IMPORTANT: Mechanism to differentiate multiple instances of the same card within a list, grid, stack, etc
// This is accomplished by a numerical index, which *should* be identical to the data-card-index attribute on the card's canvas

const Grid = ({ cardIds, groupDuplicates }: GridProps) => {
    // object keyed by card id -> array of card indices

    // reduce the array of cardIds to groups, where each unique cardId belongs to a group of one or more of the same cardId
    cardIds.forEach((cardId, idx) => {
        if (!groups[cardId]) groups[cardId] = []

        groups[cardId].push(idx)
    })

    const groups: Record<string, number[]> = cardIds.reduce(
        (groups, curr, index) => {
            if (!groups[curr]) {
                groups[curr] = []
            }

            groups[curr].push(index)

            return groups
        },
        {} as Record<string, number[]>,
    )

    // TODO: preserve the unique index per card in every stack
    // Prepare stacks for grid cells

    if (groupDuplicates) {
        const stacks = Object.entries(groups).map(([cardId, indices]) => ({
            cardId,
            count: indices.length,
        }))
    }

    return
}

export default function CanvasImageLoader() {
    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)

    const [cards, setCards] = useState<string[]>([])

    useEffect(() => {
        if (cards.length === 0) {
            setCards(
                Array.from({ length: 60 }, () => {
                    const setNumber = Math.floor(
                        Math.random() * cardSets.length,
                    )
                    const cardNumber =
                        Math.floor(Math.random() * cardSets[setNumber].count) +
                        1
                    const setStr = (setNumber + 1).toString().padStart(2, "0")
                    const cardStr = cardNumber.toString().padStart(3, "0")
                    return `/LOTR-EN${setStr}${cardStr}.png`
                }),
            )
        }
    }, [cards.length])

    // Utility to calculate grid positions
    function getGridPositions(
        cardIds: string[],
        cardWidth: number,
        cardHeight: number,
        cardsPerRow = 8,
    ) {
        return cardIds.map((cardId, idx) => {
            const row = Math.floor(idx / cardsPerRow)
            const col = idx % cardsPerRow
            return {
                cardId,
                initial: { x: col * cardWidth, y: row * cardHeight },
            }
        })
    }

    function getStackedGridPositions(
        cardIds: string[],
        cardWidth: number,
        cardHeight: number,
        cardsPerRow = 10,
        stackOffset = 15,
    ) {
        // Group cards by src
        const groups: Record<string, number[]> = {}

        cardIds.forEach((cardId, idx) => {
            if (!groups[cardId]) groups[cardId] = []
            groups[cardId].push(idx)
        })

        // Prepare stacks for grid cells
        const stacks = Object.entries(groups).map(([cardId, indices]) => ({
            cardId,
            count: indices.length,
        }))

        // Calculate row heights based on tallest stack in each row
        const rowHeights: number[] = []

        for (let i = 0; i < Math.ceil(stacks.length / cardsPerRow); i++) {
            const stackRows = stacks.slice(
                i * cardsPerRow,
                (i + 1) * cardsPerRow,
            )
            const maxStack = Math.max(...stackRows.map((s) => s.count), 1)
            rowHeights[i] = cardHeight + (maxStack - 1) * stackOffset
        }

        // Place stacks in grid, tracking y offset for each row
        const positions: {
            cardId: string
            initial: { x: number; y: number }
        }[] = []

        let y = 0
        let stackIdx = 0

        for (let row = 0; row < rowHeights.length; row++) {
            for (let col = 0; col < cardsPerRow; col++) {
                if (stackIdx >= stacks.length) {
                    break
                }

                const stack = stacks[stackIdx]

                for (let s = 0; s < stack.count; s++) {
                    positions.push({
                        cardId: stack.cardId,
                        initial: {
                            x: col * cardWidth,
                            y: y + s * stackOffset,
                        },
                    })
                }

                stackIdx++
            }

            y += rowHeights[row]
        }
        return positions
    }

    // Add new card
    // const onAdd = (e: React.FormEvent) => {
    //     e.preventDefault()
    //     setCards((prev) => [...prev, inputUrl])
    // }

    // Bring clicked card to front by moving it to end of the array
    const onStagePointerDownCapture = (
        e: React.PointerEvent<HTMLDivElement>,
    ) => {
        console.log("onStagePointerDownCapture")

        const el = (e.target as HTMLElement).closest(
            "[data-card-index]",
        ) as HTMLElement | null

        if (!el) {
            console.log("no card found")
            return
        }

        const cardId = el.getAttribute("src")

        setCards((prev) => {
            const idx = prev.findIndex((s) => s === cardId)

            if (idx === -1) {
                return prev
            }

            const next = prev.slice()
            const [picked] = next.splice(idx, 1)

            next.push(picked)
            return next
        })
    }

    // Draw & resize background
    useEffect(() => {
        const bgCanvas = bgCanvasRef.current
        const ctx = bgCanvas?.getContext("2d")
        if (!bgCanvas || !ctx) {
            return
        }

        const bgImg = new Image()
        bgImg.src = "/background.jpg"

        const drawCovered = () => {
            const cw = stageRef.current?.clientWidth ?? window.innerWidth
            const ch = stageRef.current?.clientHeight ?? window.innerHeight
            bgCanvas.width = cw
            bgCanvas.height = ch

            ctx.clearRect(0, 0, cw, ch)

            const iw = bgImg.width
            const ih = bgImg.height
            if (!iw || !ih) return

            const scale = Math.max(cw / iw, ch / ih)
            const drawWidth = iw * scale
            const drawHeight = ih * scale
            const offsetX = (cw - drawWidth) / 2
            const offsetY = (ch - drawHeight) / 2

            ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight)
        }

        const onLoad = () => {
            drawCovered()
            window.addEventListener("resize", drawCovered)
        }

        bgImg.addEventListener("load", onLoad)
        return () => {
            bgImg.removeEventListener("load", onLoad)
            window.removeEventListener("resize", drawCovered)
        }
    }, [])

    // Card layout
    const cardWidth = 115
    const cardHeight = 150
    const grid = getStackedGridPositions(cards, cardWidth, cardHeight)

    return (
        <div>
            {/* <form onSubmit={onAdd} style={{ marginBottom: 10 }}>
                <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="/LOTR-EN01151.png"
                    style={{ width: 300, marginRight: 10 }}
                />
                <button type="submit">Load</button>
            </form> */}

            <div
                ref={stageRef}
                onPointerDownCapture={onStagePointerDownCapture} // <- one handler for all cards
                style={{
                    position: "relative",
                    width: "100vw",
                    height: "100vh",
                    overflow: "hidden",
                }}
            >
                <canvas
                    ref={bgCanvasRef}
                    style={{ position: "absolute", inset: 0, zIndex: -1 }}
                />

                {grid.map((g, idx) => (
                    <Card
                        key={idx}
                        id={idx}
                        cardId={g.cardId}
                        boundaryRef={
                            bgCanvasRef as unknown as React.RefObject<HTMLElement>
                        }
                        initial={g.initial}
                        finalScale={0.125}
                        oversampleFactor={2}
                    />
                ))}
            </div>

            {/* Example button to trigger grid layout */}
            <button onClick={() => setCards(cards)}>Import deck</button>
        </div>
    )
}
