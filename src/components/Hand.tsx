"use client"

import Card from "./Card"
import "./Hand.scss"

interface HandProps {
    boundaryRef: React.RefObject<HTMLElement> | null
    cardIds: string[]
    transform?: string
}

const Hand = ({ boundaryRef, cardIds, transform }: HandProps) => {
    return (
        <div
            className="hand"
            style={{
                position: "fixed",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                pointerEvents: "none", // so it doesn't block grid cards
            }}
        >
            {cardIds.map((cardId, index) => (
                <Card
                    className="hand-card"
                    key={index}
                    index={index}
                    cardId={cardId}
                    boundaryRef={boundaryRef as React.RefObject<HTMLElement>}
                    finalScale={0.125}
                    transform={`translate(-50%, -50%) rotate(-50deg / 2 + 50deg / 6 * $i)`}
                />
            ))}
        </div>
    )
}

export default Hand
