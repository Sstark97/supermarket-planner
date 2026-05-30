"use client";

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryParams } from "@/hooks/useQueryParams";

export function SearchBar() {
	const router = useRouter();
	const { searchParams, buildMergedHref } = useQueryParams();
	const defaultQuery = searchParams.get("q") || "";

	const [searchTerm, setSearchTerm] = useState(defaultQuery);

	useEffect(() => {
		setSearchTerm(defaultQuery);
	}, [defaultQuery]);

	const handleSubmit = (e: React.SubmitEvent) => {
		e.preventDefault();
		router.push(buildMergedHref({ q: searchTerm }));
	};

	const handleClear = () => {
		setSearchTerm("");
		router.push(buildMergedHref({ q: null }));
	};

	return (
		<form onSubmit={handleSubmit} className="flex-1 relative">
			<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<Search size={18} className="text-slate-400" />
			</div>
			<input
				type="text"
				placeholder="Busca un producto (ej. leche, pan...)"
				className="w-full pl-10 pr-4 py-3 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all duration-300 min-h-11"
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
			/>
			{searchTerm && (
				<button
					type="button"
					onClick={handleClear}
					className="absolute inset-y-0 right-0 pr-3 flex items-center min-w-11 justify-end text-slate-400 hover:text-slate-600"
				>
					<X size={16} />
				</button>
			)}
		</form>
	);
}
