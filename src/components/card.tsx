"use client"

import { useEffect, useRef } from "react"
import { useBoundedDrag } from "@/hooks/useBoundedDrag"

type Props = {
    /** Image URL to draw onto this card’s canvas */
    src: string
    /** The element that provides movement bounds (your background canvas or a board container) */
    boundaryRef: React.RefObject<HTMLElement>
    /** Force a redraw when this changes (e.g., clicking a “Load” button) */
    reloadKey?: number
    /** Starting position */
    initial?: { x: number; y: number }
    /** Final displayed scale (CSS pixels) relative to original image size */
    finalScale?: number // default 0.125
    /** Internal oversampling factor for crisper downscaling */
    oversampleFactor?: number // default 2
    /** Lock movement to an axis */
    lockAxis?: "x" | "y"
}

export default function Card({
    src,
    boundaryRef,
    reloadKey,
    initial = { x: 0, y: 0 },
    oversampleFactor = 2,
    lockAxis,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const finalScale = 0.15 // Default scale for final display

    // Drag within boundary
    const { offset, dragging } = useBoundedDrag({
        targetRef: canvasRef as unknown as React.RefObject<HTMLElement>,
        boundaryRef,
        initial,
        lockAxis,
    })

    // Load and draw the image whenever src / reloadKey changes
    useEffect(() => {
        const cardCanvas = canvasRef.current
        if (!cardCanvas) return

        const ctx = cardCanvas.getContext("2d")

        if (!ctx) {
            return
        }

        const img = new Image()
        img.src = src

        img.onload = () => {
            const targetWidth = img.width * finalScale
            const targetHeight = img.height * finalScale

            const oversampledWidth = Math.max(
                1,
                Math.floor(targetWidth * oversampleFactor),
            )

            const oversampledHeight = Math.max(
                1,
                Math.floor(targetHeight * oversampleFactor),
            )

            // Progressive downscale for quality
            let currentCanvas = document.createElement("canvas")
            currentCanvas.width = img.width
            currentCanvas.height = img.height

            let currentCtx = currentCanvas.getContext("2d")!
            currentCtx.drawImage(img, 0, 0)

            let cw = img.width
            let ch = img.height

            // Scale down in ~15% steps until near oversampled size
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

            // Final draw to visible canvas at oversampled size
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

            // Display at target size
            cardCanvas.style.width = `${targetWidth}px`
            cardCanvas.style.height = `${targetHeight}px`
        }

        img.onerror = () => {
            console.error("Failed to load image:", src)
        }
    }, [src, reloadKey, finalScale, oversampleFactor])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 0,
                imageRendering: "auto",
                transform: `translate(${offset.x}px, ${offset.y}px)`,
                cursor: dragging ? "grabbing" : "grab",
            }}
        />
    )
}
