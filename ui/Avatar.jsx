import { forwardRef } from "react";
import { cn } from "@/lib/utils";
const AvatarImage = forwardRef(({ src, alt, ...props }, ref) => (<img ref={ref} src={src} alt={alt} {...props}/>));
AvatarImage.displayName = "AvatarImage";
export { AvatarImage };
const AvatarFallback = forwardRef(({ children, className, ...props }, ref) => (<span ref={ref} className={cn("flex items-center justify-center text-sm font-semibold text-slate-500", className)} {...props}>
      {children || <></>}
    </span>));
AvatarFallback.displayName = "AvatarFallback";
export { AvatarFallback };
const Avatar = forwardRef(({ src, fallback, className, ...props }, ref) => {
    return (<div className={cn("relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200", className)}>
        {src && <img src={src} alt="" className="h-full w-full object-cover"/>}
        {!src && fallback && (<span className="flex items-center justify-center text-sm font-semibold text-slate-500">
            {fallback.charAt(0).toUpperCase()}
          </span>)}
      </div>);
});
Avatar.displayName = "Avatar";
export { Avatar };
