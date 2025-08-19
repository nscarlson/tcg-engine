// CanvasImageLoader.tsx
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

    const [inputUrl, setInputUrl] = useState("/LOTR-EN01151.png")
    const [cards, setCards] = useState<CardSpec[]>([
        {
            id: 1,
            src: "/LOTR-EN01151.png",
            initial: { x: 0, y: 0 },
            finalScale: 0.125,
            oversampleFactor: 2,
        },
    ])
    const nextIdRef = useRef(2)

    const onAdd = (e: React.FormEvent) => {
        e.preventDefault()
        const id = nextIdRef.current++
        const n = cards.length
        setCards((prev) => [
            ...prev,
            {
                id,
                src: inputUrl,
                initial: { x: 20 * n, y: 20 * n },
                finalScale: 0.125,
                oversampleFactor: 2,
            },
        ])
    }

    // Bring clicked card to front by moving it to end of the array
    const onStagePointerDownCapture = (
        e: React.PointerEvent<HTMLDivElement>,
    ) => {
        const el = (e.target as HTMLElement).closest(
            "[data-card-id]",
        ) as HTMLElement | null
        if (!el) return
        const id = Number(el.getAttribute("data-card-id"))
        setCards((prev) => {
            const idx = prev.findIndex((c) => c.id === id)
            if (idx === -1) return prev
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
            {/* original look */}
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

                {cards.map((c) => (
                    <Card
                        key={c.id}
                        id={c.id}
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
