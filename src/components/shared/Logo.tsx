export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary rounded-full p-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          className="h-7 w-7 text-primary-foreground"
          fill="currentColor"
        >
          <path d="M25,35a5,5 0 0 1 10,0V65a5,5 0 0 1-10,0Z M45,35a5,5 0 0 1 10,0V65a5,5 0 0 1-10,0Z M65,35a5,5 0 0 1 10,0V65a5,5 0 0 1-10,0Z" />
        </svg>
      </div>

      <span className="text-xl font-bold font-headline tracking-tight">
        MotionMint Hub
      </span>
    </div>
  );
}
