import { Film } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Film className="h-8 w-8 text-primary" />
      <span className="text-xl font-bold font-headline tracking-tight">
        MotionFlow
      </span>
    </div>
  );
}
