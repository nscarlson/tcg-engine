"use client";

import { useEffect, useRef, useState } from "react";

export default function CanvasImageLoader() {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [inputUrl, setInputUrl] = useState("/LOTR-EN01151.png")

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [startMousePos, setStartMousePos] = useState({ x: 0, y: 0 });
  const [startOffset, setStartOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      setDragging(true);
      setStartMousePos({ x: e.clientX, y: e.clientY });
      setStartOffset({ ...offset });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startMousePos.x;
      const dy = e.clientY - startMousePos.y;
      setOffset({
        x: startOffset.x + dx,
        y: startOffset.y + dy,
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, offset, startMousePos, startOffset]);


  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const ctx = bgCanvas?.getContext("2d");
    if (!bgCanvas || !ctx) return;

    const bgImg = new Image();
    bgImg.src = "/background.jpg"; // Your image in the public folder

    const drawCovered = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      bgCanvas.width = cw;
      bgCanvas.height = ch;

      ctx.clearRect(0, 0, cw, ch);

      const iw = bgImg.width;
      const ih = bgImg.height;

      const scale = Math.max(cw / iw, ch / ih);

      const drawWidth = iw * scale;
      const drawHeight = ih * scale;

      const offsetX = (cw - drawWidth) / 2;
      const offsetY = (ch - drawHeight) / 2;

      ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
    };

    // const resizeCanvas = () => {
    //   bgCanvas.width = window.innerWidth;
    //   bgCanvas.height = window.innerHeight;

    //   // Optionally scale image to fit the canvas, or just draw it at top-left
    //   ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    //   ctx.drawImage(img, 0, 0); // Or add scaling logic if desired
    // };

    bgImg.onload = () => {
      drawCovered();
      window.addEventListener("resize", drawCovered);
    };

  }, [])

  const loadAndDrawImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = inputUrl;

    img.onload = () => {
      const finalScale = 0.125; // <- Desired final visible scale
      const oversampleFactor = 2; // <- Draw internally at 2x res

      const targetWidth = img.width * finalScale;
      const targetHeight = img.height * finalScale;
      const oversampledWidth = targetWidth * oversampleFactor;
      const oversampledHeight = targetHeight * oversampleFactor;

      // Step 1: progressively scale to oversampled size
      let currentCanvas = document.createElement("canvas");
      currentCanvas.width = img.width;
      currentCanvas.height = img.height;

      let currentCtx = currentCanvas.getContext("2d")!;
      currentCtx.drawImage(img, 0, 0);

      let currentWidth = img.width;
      let currentHeight = img.height;

      while (currentWidth * 0.85 > oversampledWidth) {
        const nextWidth = Math.floor(currentWidth * 0.85);
        const nextHeight = Math.floor(currentHeight * 0.85);

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = nextWidth;
        tempCanvas.height = nextHeight;

        const tempCtx = tempCanvas.getContext("2d")!;
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = "high";

        tempCtx.drawImage(
          currentCanvas,
          0, 0, currentWidth, currentHeight,
          0, 0, nextWidth, nextHeight
        );

        currentCanvas = tempCanvas;
        currentCtx = tempCtx;
        currentWidth = nextWidth;
        currentHeight = nextHeight;
      }

      // Step 2: draw final image to visible canvas (at oversampled size)
      canvas.width = oversampledWidth;
      canvas.height = oversampledHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(currentCanvas, 0, 0, oversampledWidth, oversampledHeight);

      // Step 3: set canvas style to display at target (¼) size
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetHeight}px`;
    };

    img.onerror = () => {
      console.error("Failed to load image:", inputUrl);
    };
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="/LOTR-EN01151.png"
          style={{ width: "300px", marginRight: "10px"           }}
        />
        <button onClick={loadAndDrawImage}>Load</button>
      </div>
    
      <canvas
        ref={bgCanvasRef}
        style={{
          position: "absolute",
          zIndex: -1
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
          imageRendering: "auto",
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          cursor: dragging ? "grabbing" : "grab"
        }}      />
    </div>
  );
}
