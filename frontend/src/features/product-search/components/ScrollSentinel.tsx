"use client";

import { useEffect, useRef } from "react";

interface ScrollSentinelProps {
	onIntersect: () => void;
	hasNextPage: boolean;
}

export function ScrollSentinel({
	onIntersect,
	hasNextPage,
}: ScrollSentinelProps): React.ReactElement {
	const sentinelRef = useRef<HTMLDivElement>(null);
	const onIntersectRef = useRef(onIntersect);

	useEffect(() => {
		onIntersectRef.current = onIntersect;
	});

	useEffect(() => {
		if (!hasNextPage) return;

		const sentinelElement = sentinelRef.current;
		if (!sentinelElement) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					onIntersectRef.current();
				}
			},
			{ rootMargin: "200px" },
		);

		observer.observe(sentinelElement);

		return () => observer.disconnect();
	}, [hasNextPage]);

	return <div ref={sentinelRef} aria-hidden="true" />;
}
