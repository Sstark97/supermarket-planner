import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KiloxLogo } from "./KiloxLogo";

describe("KiloxLogo", () => {
	it("should render an svg with the expected viewBox and accessibility attributes", () => {
		const { container } = render(<KiloxLogo />);

		const svg = container.querySelector("svg");
		expect(svg).toBeTruthy();
		expect(svg?.getAttribute("viewBox")).toBe("0 0 100 100");
		expect(svg?.getAttribute("role")).toBe("img");
		expect(svg?.getAttribute("aria-label")).toBe("Kilox Market logo");
	});

	it("should render a linearGradient inside defs and apply it to at least one path", () => {
		const { container } = render(<KiloxLogo />);

		const gradient = container.querySelector("defs linearGradient");
		expect(gradient).toBeTruthy();

		const gradientId = gradient?.getAttribute("id");
		expect(gradientId).toBeTruthy();

		const referencingElement = container.querySelector(
			`[stroke="url(#${gradientId})"], [fill="url(#${gradientId})"]`,
		);
		expect(referencingElement).toBeTruthy();
	});

	it("should forward width, height and className props", () => {
		const { container } = render(
			<KiloxLogo width={64} height={48} className="custom-class" />,
		);

		const svg = container.querySelector("svg");
		expect(svg?.getAttribute("width")).toBe("64");
		expect(svg?.getAttribute("height")).toBe("48");
		expect(svg?.classList.contains("custom-class")).toBe(true);
	});

	it("should generate a unique gradient id per instance to avoid collisions", () => {
		const { container } = render(
			<>
				<KiloxLogo />
				<KiloxLogo />
			</>,
		);

		const gradients = container.querySelectorAll("defs linearGradient");
		expect(gradients).toHaveLength(2);
		expect(gradients[0].getAttribute("id")).not.toBe(
			gradients[1].getAttribute("id"),
		);
	});
});
