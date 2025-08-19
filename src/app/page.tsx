"use client"

import { useEffect, useRef, useState } from "react"
import Card from "../components/card"

type CardSpec = {
    id: number
    src: string
    initial: { x: number; y: number }
    finalScale?: number
    oversampleFactor?: number
}

export default function CanvasImageLoader() {
    const bgCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)

    // Input for adding a new card
    const [inputUrl, setInputUrl] = useState("/LOTR-EN01151.png")

    // Cards state: seed with your original single card
    const [cards, setCards] = useState<CardSpec[]>([
        {
            id: 1,
            src: "/LOTR-EN01151.png",
            initial: { x: 0, y: 0 },
            finalScale: 0.125,
            oversampleFactor: 2,
        },
    ])

    // Simple id generator
    const nextIdRef = useRef(2)

    // Add card on submit (looks like original UI)
    const onAdd = (e: React.FormEvent) => {
        e.preventDefault()
        const id = nextIdRef.current++
        const n = cards.length
        setCards((prev) => [
            ...prev,
            {
                id,
                src: inputUrl,
                initial: { x: 20 * n, y: 20 * n }, // stagger so they don't perfectly overlap
                finalScale: 0.125,
                oversampleFactor: 2,
            },
        ])
    }

    // Draw & resize the background to cover the stage
    useEffect(() => {
        const bgCanvas = bgCanvasRef.current
        const ctx = bgCanvas?.getContext("2d")
        if (!bgCanvas || !ctx) return

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

    return (
        <div>
            {/* Looks like your original input row */}
            <form onSubmit={onAdd} style={{ marginBottom: 10 }}>
                <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="/LOTR-EN01151.png"
                    style={{ width: 300, marginRight: 10 }}
                />
                <button type="submit">Load</button>
            </form>

            {/* Stage: a positioned container for the canvases */}
            <div
                ref={stageRef}
                style={{
                    position: "relative",
                    width: "100vw",
                    height: "100vh",
                    overflow: "hidden",
                }}
            >
                <canvas
                    ref={bgCanvasRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: -1,
                    }}
                />

                {/* Render all cards */}
                {cards.map((c) => (
                    <Card
                        key={c.id}
                        src={c.src}
                        boundaryRef={
                            bgCanvasRef as unknown as React.RefObject<HTMLElement>
                        }
                        initial={c.initial}
                        finalScale={c.finalScale}
                        oversampleFactor={c.oversampleFactor}
                    />
                ))}
            </div>
        </div>
    )
}
