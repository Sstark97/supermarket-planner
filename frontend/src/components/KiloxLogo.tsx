import React from "react";

interface KiloxLogoProps {
	width?: number | string;
	height?: number | string;
	className?: string;
}

export function KiloxLogo({
	width = 36,
	height = 36,
	className,
}: KiloxLogoProps): React.ReactElement {
	const gradientId = `kiloxGradient-${React.useId()}`;

	return (
		<svg
			viewBox="0 0 100 100"
			width={width}
			height={height}
			className={className}
			role="img"
			aria-label="Kilox Market logo"
		>
			<defs>
				<linearGradient
					id={gradientId}
					gradientUnits="userSpaceOnUse"
					x1="0"
					y1="0"
					x2="100"
					y2="100"
				>
					<stop offset="0%" stopColor="#1D4ED8" />
					<stop offset="100%" stopColor="#06B6D4" />
				</linearGradient>
			</defs>

			{/* Cart silhouette: basket body + wheels */}
			<path
				d="M18 22 H30 L38 60 H74 L82 34 H40"
				fill="none"
				stroke={`url(#${gradientId})`}
				strokeWidth="8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="44" cy="74" r="6" fill={`url(#${gradientId})`} />
			<circle cx="70" cy="74" r="6" fill={`url(#${gradientId})`} />

			{/* Interlocking "X" overlay */}
			<path
				d="M52 30 L86 64"
				stroke={`url(#${gradientId})`}
				strokeWidth="8"
				strokeLinecap="round"
			/>
			<path
				d="M86 30 L52 64"
				stroke={`url(#${gradientId})`}
				strokeWidth="8"
				strokeLinecap="round"
			/>
		</svg>
	);
}
