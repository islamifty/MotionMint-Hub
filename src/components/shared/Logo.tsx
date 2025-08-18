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
          <path d="M83.21,43.27V71.43a5.5,5.5,0,0,1-11,0V57.39L60.6,71.43a5.5,5.5,0,0,1-7.78-7.78L64.44,52,52.82,40.39a5.5,5.5,0,0,1,7.78-7.78L72.21,44.22V43.27a5.5,5.5,0,1,1,11,0Zm-38,0V71.43a5.5,5.5,0,0,1-11,0V43.27a5.5,5.5,0,0,1,11,0Zm-21.8,0V71.43a5.5,5.5,0,0,1-11,0V57.39L.8,71.43a5.5,5.5,0,0,1-7.78-7.78L5.64,52-6-1.61a5.5,5.5,0,0,1,7.78-7.78L12.41,44.22V43.27a5.5,5.5,0,1,1,11,0ZM94.5,71.43a5.5,5.5,0,1,1-11,0,5.5,5.5,0,0,1,11,0Z" transform="translate(6 14.29)" />
        </svg>
      </div>

      <span className="text-xl font-bold font-headline tracking-tight">
        MotionMint Hub
      </span>
    </div>
  );
}
