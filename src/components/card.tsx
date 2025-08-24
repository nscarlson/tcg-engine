// Drag and boundary logic is handled exclusively by useBoundedDrag.
// This component only uses the hook and does not implement its own drag/boundary logic.

// components/card.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useBoundedDrag } from "../hooks/useBoundedDrag"

type Props = {
    index: number
    cardId: string
    boundaryRef: React.RefObject<HTMLElement>
    initial?: { x: number; y: number }
    finalScale?: number
    oversampleFactor?: number
    lockAxis?: "x" | "y"
}

export default function Card({
    index,
    cardId,
    boundaryRef,
    initial = { x: 0, y: 0 },
    finalScale = 1,
    oversampleFactor = 2,
    lockAxis,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const { offset, dragging } = useBoundedDrag({
        targetRef: canvasRef as unknown as React.RefObject<HTMLElement>,
        boundaryRef,
        initial,
        lockAxis,
    })

    const [cssSize, setCssSize] = useState<{ w: number; h: number }>({
        w: 0,
        h: 0,
    })
    const [isReady, setIsReady] = useState(false) // <-- updated name

    useEffect(() => {
        const cardCanvas = canvasRef.current
        if (!cardCanvas) {
            return
        }

        const ctx = cardCanvas.getContext("2d")

        if (!ctx) {
            return
        }

        const img = new Image()

        img.onload = () => {
            console.log("Image loaded:", cardId)
            const iw = img.width
            const ih = img.height

            if (!iw || !ih) {
                return
            }

            // calculate sampling sizes for scaling down
            const targetWidth = iw * finalScale
            const targetHeight = ih * finalScale

            const oversampledWidth = Math.max(
                1,
                Math.floor(targetWidth * oversampleFactor),
            )

            const oversampledHeight = Math.max(
                1,
                Math.floor(targetHeight * oversampleFactor),
            )

            let currentCanvas = document.createElement("canvas")
            currentCanvas.width = iw
            currentCanvas.height = ih

            let currentCtx = currentCanvas.getContext("2d")!
            currentCtx.drawImage(img, 0, 0)

            let cw = iw
            let ch = ih

            while (cw * 0.85 > oversampledWidth) {
                const nextW = Math.max(1, Math.floor(cw * 0.85))
                const nextH = Math.max(1, Math.floor(ch * 0.85))
                const tmp = document.createElement("canvas")
                tmp.width = nextW
                tmp.height = nextH
                const tctx = tmp.getContext("2d")!
                tctx.imageSmoothingEnabled = true
                tctx.imageSmoothingQuality = "high"
                tctx.drawImage(currentCanvas, 0, 0, cw, ch, 0, 0, nextW, nextH)

                currentCanvas = tmp
                currentCtx = tctx

                cw = nextW
                ch = nextH
            }

            cardCanvas.width = oversampledWidth
            cardCanvas.height = oversampledHeight
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"
            ctx.clearRect(0, 0, cardCanvas.width, cardCanvas.height)
            ctx.drawImage(
                currentCanvas,
                0,
                0,
                oversampledWidth,
                oversampledHeight,
            )

            setCssSize({ w: targetWidth, h: targetHeight })

            setIsReady(true)
        }

        img.onerror = () => {
            console.error("Failed to load image:", cardId)
            setIsReady(false)
        }

        img.src = cardId // <-- Set src after handlers

        return () => {
            img.onload = null
            img.onerror = null
        }
    }, [cardId, finalScale, oversampleFactor])

    return (
        <canvas
            ref={canvasRef}
            data-card-index={index} // <- parent uses this to identify the clicked card
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 0,
                imageRendering: "auto",
                width: cssSize.w ? `${cssSize.w}px` : undefined,
                height: cssSize.h ? `${cssSize.h}px` : undefined,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                cursor: dragging ? "grabbing" : "grab",
                willChange: "transform",
                visibility: isReady ? "visible" : "hidden", // <-- keep canvas in DOM but hide it
            }}
        />
    )
}
