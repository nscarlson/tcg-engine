"use client"

import { useEffect, useRef, useState } from "react"

export type UseBoundedDragOptions = {
    /** The element you want to drag (your card canvas). */
    targetRef: React.RefObject<HTMLElement>
    /** The element providing bounds (your background canvas or a board container). */
    boundaryRef: React.RefObject<HTMLElement>
    /** Starting offset in CSS pixels. */
    initial?: { x: number; y: number }
    /** Optionally lock movement to one axis. */
    lockAxis?: "x" | "y"
}

export type UseBoundedDragReturn = {
    offset: { x: number; y: number }
    dragging: boolean
    /** Manually set offset (e.g., snapping, programmatic moves). */
    setOffset: (pos: { x: number; y: number }) => void
}

/**
 * Drag the `targetRef` within the visual box of `boundaryRef`, clamped so the target
 * never leaves the boundary. Works with canvases that are positioned absolutely
 * and moved via CSS transform: translate(x, y).
 *
 * This hook only manages the offset; you apply it to your target with:
 *   style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
 */
export function useBoundedDrag({
    targetRef,
    boundaryRef,
    initial = { x: 0, y: 0 },
    lockAxis,
}: UseBoundedDragOptions): UseBoundedDragReturn {
    const [offset, setOffset] = useState(initial)
    const [dragging, setDragging] = useState(false)

    // Refs to avoid stale closures during fast pointermoves
    const startMouseRef = useRef({ x: 0, y: 0 })
    const startOffsetRef = useRef({ x: initial.x, y: initial.y })

    // Reset offset when initial changes
    useEffect(() => {
        const target = targetRef.current
        const boundary = boundaryRef.current
        if (!target || !boundary) return

        // Reset to initial position when refs change
        const onPointerDown = (e: PointerEvent) => {
            // Only primary button for drag
            if (e.button !== 0) return
            setDragging(true)
            startMouseRef.current = { x: e.clientX, y: e.clientY }
            startOffsetRef.current = { x: offset.x, y: offset.y }
            // Capture pointer so movement continues outside the target
            ;(target as Element).setPointerCapture?.(e.pointerId)
        }

        // Handle pointer events
        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) {
                return
            }

            const dx = e.clientX - startMouseRef.current.x
            const dy = e.clientY - startMouseRef.current.y

            // Proposed new position before clamping
            let nextX = startOffsetRef.current.x + dx
            let nextY = startOffsetRef.current.y + dy

            if (lockAxis === "x") nextY = startOffsetRef.current.y
            if (lockAxis === "y") nextX = startOffsetRef.current.x

            // Measure visible sizes (CSS pixels)
            const boundaryRect = boundary.getBoundingClientRect()
            const targetRect = target.getBoundingClientRect()

            const maxX = Math.max(0, boundaryRect.width - targetRect.width)
            const maxY = Math.max(0, boundaryRect.height - targetRect.height)

            // Clamp so the target stays fully inside the boundary
            const clampedX = Math.min(Math.max(nextX, 0), maxX)
            const clampedY = Math.min(Math.max(nextY, 0), maxY)

            setOffset({ x: clampedX, y: clampedY })
        }

        const onPointerUp = (e: PointerEvent) => {
            setDragging(false)
            ;(target as Element).releasePointerCapture?.(e.pointerId)
        }

        target.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)

        return () => {
            target.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
        }
    }, [targetRef, boundaryRef, dragging, offset.x, offset.y, lockAxis])

    return { offset, dragging, setOffset }
}
