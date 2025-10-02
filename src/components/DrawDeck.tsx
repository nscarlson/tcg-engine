"use client"

import Card from "./Card"

const DrawDeck = ({
    bgCanvasRef,
}: {
    bgCanvasRef: React.RefObject<HTMLCanvasElement>
}) => {
    return (
        <div
            style={{
                position: "fixed",
                left: "50%",
                bottom: 24,
                transform: "translateX(-50%)",
                zIndex: 9999,
                pointerEvents: "none",
                background: "rgba(0,0,0,0.05)",
            }}
        >
            <Card
                index={-2}
                cardId={"/LOTR-EN_CARD_BACK.png"}
                boundaryRef={bgCanvasRef as React.RefObject<HTMLElement>}
                initial={{ x: 0, y: 0 }}
                finalScale={0.125}
                oversampleFactor={2}
                zIndex={9999}
                isPreview={true}
            />
        </div>
    )
}

export default DrawDeck
