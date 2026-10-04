import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { FPS } from "../theme";

// Mystic Woods sheets: 6 cols x 10 rows of 48px cells.
// Rows: 0 idle down, 1 idle side, 2 idle up, 3 walk down, 4 walk side, 5 walk up.
export const ROW = { idleDown: 0, idleSide: 1, idleUp: 2, walkDown: 3, walkSide: 4, walkUp: 5 };

type SpriteProps = {
  src: string;
  row: number;
  scale: number;
  // Fixed column; omit to animate through `cols` frames at `animFps`.
  col?: number;
  cols?: number;
  animFps?: number;
  flip?: boolean;
  sheetW?: number;
  sheetH?: number;
  cell?: number;
  style?: React.CSSProperties;
};

export const Sprite: React.FC<SpriteProps> = ({
  src,
  row,
  scale,
  col,
  cols = 6,
  animFps = 8,
  flip,
  sheetW = 288,
  sheetH = 480,
  cell = 48,
  style,
}) => {
  const frame = useCurrentFrame();
  const c = col ?? Math.floor((frame / FPS) * animFps) % cols;
  return (
    <Crop
      src={src}
      sheetW={sheetW}
      sheetH={sheetH}
      x={c * cell}
      y={row * cell}
      w={cell}
      h={cell}
      scale={scale}
      style={{ transform: flip ? "scaleX(-1)" : undefined, ...style }}
    />
  );
};

type CropProps = {
  src: string;
  sheetW: number;
  sheetH: number;
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  style?: React.CSSProperties;
};

// Shows one rectangle of a sprite sheet, scaled up with crisp pixels.
export const Crop: React.FC<CropProps> = ({ src, sheetW, sheetH, x, y, w, h, scale, style }) => (
  <div
    style={{
      width: w * scale,
      height: h * scale,
      overflow: "hidden",
      position: "relative",
      ...style,
    }}
  >
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: -x * scale,
        top: -y * scale,
        width: sheetW * scale,
        height: sheetH * scale,
        maxWidth: "none",
        imageRendering: "pixelated",
      }}
    />
  </div>
);

// Places a child so (x, y) is its centre.
export const At: React.FC<{ x: number; y: number; z?: number; children: React.ReactNode }> = ({
  x,
  y,
  z,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: "translate(-50%, -50%)",
      zIndex: z ?? Math.round(y),
    }}
  >
    {children}
  </div>
);

// Realm props, using the same source rects as lib/realm/objectSprites.ts.
export const House: React.FC<{ scale: number; phase?: number }> = ({ scale, phase = 0 }) => {
  const frame = useCurrentFrame();
  const i = (Math.floor(frame / 5) + phase) % 12;
  return (
    <Crop src="realm/house.png" sheetW={480} sheetH={272} x={(i % 6) * 80} y={Math.floor(i / 6) * 136} w={80} h={136} scale={scale} />
  );
};

export const Tree: React.FC<{ scale: number }> = ({ scale }) => (
  <Crop src="realm/maple-tree.png" sheetW={160} sheetH={48} x={96} y={1} w={32} h={46} scale={scale} />
);

export const Bush: React.FC<{ scale: number }> = ({ scale }) => (
  <Crop src="realm/maple-tree.png" sheetW={160} sheetH={48} x={71} y={14} w={20} h={33} scale={scale} />
);

export const Chest: React.FC<{ scale: number; open: boolean }> = ({ scale, open }) => (
  <Crop src="realm/chest.png" sheetW={32} sheetH={32} x={0} y={open ? 16 : 0} w={32} h={16} scale={scale} />
);

export const Fence: React.FC<{ scale: number }> = ({ scale }) => (
  <Crop src="realm/fence.png" sheetW={48} sheetH={80} x={0} y={32} w={48} h={22} scale={scale} />
);
