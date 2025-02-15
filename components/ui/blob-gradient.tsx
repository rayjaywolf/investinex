export function BlobGradient() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.1), transparent)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle at center, rgba(5, 150, 105, 0.2), rgba(16, 185, 129, 0.1), transparent)",
        }}
      />
    </div>
  );
}
