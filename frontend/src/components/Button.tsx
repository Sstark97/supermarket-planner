import React from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "default" | "kilox" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	isLoading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
	default: "bg-slate-900 hover:bg-slate-800 text-white",
	kilox:
		"bg-kilox-sapphire text-white font-semibold shadow-sm hover:bg-kilox-sapphire/90 hover:shadow-md active:bg-kilox-sapphire/80",
	secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
	sm: "text-xs px-3 py-1.5 gap-1",
	md: "text-sm px-4 py-2 gap-1.5",
	lg: "text-base px-6 py-3 gap-2",
};

const BASE_CLASSES =
	"inline-flex items-center justify-center rounded-xl cursor-pointer transition-[background-color,filter,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-kilox-sapphire disabled:opacity-60 disabled:cursor-not-allowed";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	function Button(
		{
			variant = "default",
			size = "md",
			isLoading = false,
			disabled,
			className,
			children,
			...buttonProps
		},
		ref,
	) {
		const classes = [
			BASE_CLASSES,
			VARIANT_CLASSES[variant],
			SIZE_CLASSES[size],
			className,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<button
				ref={ref}
				className={classes}
				disabled={disabled || isLoading}
				aria-busy={isLoading}
				{...buttonProps}
			>
				{isLoading && (
					<Loader2 size={16} className="animate-spin" aria-hidden="true" />
				)}
				{children}
			</button>
		);
	},
);
