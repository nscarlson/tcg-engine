"use client"

import { useEffect, useRef, useState } from "react"

const Card = ({ bgCanvasRef }: { bgCanvasRef: any }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const [dragging, setDragging] = useState(false)

    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [startMousePos, setStartMousePos] = useState({ x: 0, y: 0 })
    const [startOffset, setStartOffset] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const canvas = canvasRef.current

        if (!canvas) {
            return
        }

        const handleMouseUp = () => {
            setDragging(false)
        }

        const handleMouseDown = (e: MouseEvent) => {
            if (!canvasRef.current) return
            setDragging(true)
            setStartMousePos({ x: e.clientX, y: e.clientY })
            setStartOffset({ ...offset })
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging) return
            const dx = e.clientX - startMousePos.x
            const dy = e.clientY - startMousePos.y

            const canvasEl = canvasRef.current
            const bgCanvasEl = bgCanvasRef.current

            if (!canvasEl || !bgCanvasEl) {
                return
            }

            // Get background canvas size
            const bgWidth = bgCanvasEl.width
            const bgHeight = bgCanvasEl.height

            // Get current canvas (overlay) visible size
            const visibleWidth = canvasEl.getBoundingClientRect().width
            const visibleHeight = canvasEl.getBoundingClientRect().height

            // Calculate proposed offset
            let nextX = startOffset.x + dx
            let nextY = startOffset.y + dy

            // Clamp so the overlay stays within bounds
            nextX = Math.min(0, Math.max(nextX, bgWidth - visibleWidth))
            nextY = Math.min(0, Math.max(nextY, bgHeight - visibleHeight))

            setOffset({ x: nextX, y: nextY })
        }

        canvas.addEventListener("mousedown", handleMouseDown)
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown)
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [dragging, offset, startMousePos, startOffset])

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

export default Card
