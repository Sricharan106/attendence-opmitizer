// frontend/src/components/ui/loader.tsx

interface BouncingCubesProps {
  size?: number;
  color?: string;
}

export function BouncingCubes({
  size = 45,
  color = "currentColor",
}: BouncingCubesProps) {
  const speed = 1.75;

  return (
    <div
      className="flex items-end justify-between pb-[20%]"
      style={{
        width: `${size}px`,
        height: `${size * 0.6}px`,
      }}
    >
      {[0, -0.36, -0.2].map((delay, index) => (
        <div
          key={index}
          className="shrink-0 animate-cube-jump"
          style={{
            width: `${size * 0.2}px`,
            height: `${size * 0.2}px`,
            animationDuration: `${speed}s`,
            animationDelay: `${speed * delay}s`,
          }}
        >
          <div
            className="h-full w-full rounded-[25%] animate-cube-morph"
            style={{
              backgroundColor: color,
              transformOrigin: "center bottom",
              animationDuration: `${speed}s`,
              animationDelay: `${speed * delay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
