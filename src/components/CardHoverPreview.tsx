"use client"

import Card from "./Card"

interface CardHoverPreviewProps {
    previewCard: { index: number; cardId: string } | null
    showPreview: boolean
    bgCanvasRef: React.RefObject<HTMLElement>
}

const CardHoverPreview = ({
    previewCard,
    showPreview,
    bgCanvasRef,
}: CardHoverPreviewProps) => {
    return (
        <div
            style={{
                position: "fixed",
                top: 24,
                right: 24,
                zIndex: 9999,
                pointerEvents: "none",
                background: "rgba(0,0,0,0.05)",
                padding: 8,
                borderRadius: 8,
                opacity: showPreview ? 1 : 0,
                transition: "opacity 0.3s ease",
            }}
        >
            {previewCard && (
                <Card
                    index={previewCard.index}
                    cardId={previewCard.cardId}
                    boundaryRef={
                        bgCanvasRef as unknown as React.RefObject<HTMLElement>
                    }
                    initial={{ x: 0, y: 0 }}
                    finalScale={1}
                    oversampleFactor={2}
                    zIndex={9999}
                    isPreview={true}
                />
            )}
        </div>
    )
}

export default CardHoverPreview
