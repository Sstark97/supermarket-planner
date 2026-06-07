import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
	it("should apply the default variant classes by default", () => {
		render(<Button>Click me</Button>);

		const button = screen.getByRole("button", { name: "Click me" });
		expect(button.className).toContain("bg-slate-900");
		expect(button.className).toContain("hover:bg-slate-800");
	});

	it("should apply the kilox variant brand classes", () => {
		render(<Button variant="kilox">Añadir</Button>);

		const button = screen.getByRole("button", { name: "Añadir" });
		expect(button.className).toContain("bg-kilox-sapphire");
		expect(button.className).toContain("font-semibold");
	});

	it("should apply the secondary variant classes", () => {
		render(<Button variant="secondary">Cancelar</Button>);

		const button = screen.getByRole("button", { name: "Cancelar" });
		expect(button.className).toContain("bg-slate-100");
		expect(button.className).toContain("text-slate-700");
	});

	it("should render a spinner and disable the button when isLoading is true", () => {
		render(<Button isLoading>Guardar</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveProperty("disabled", true);
		expect(button.getAttribute("aria-busy")).toBe("true");
		expect(button.querySelector("svg")).toBeTruthy();
	});

	it("should propagate onClick events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Press</Button>);

		fireEvent.click(screen.getByRole("button", { name: "Press" }));

		expect(handleClick).toHaveBeenCalledOnce();
	});

	it("should forward unknown props to the underlying button element", () => {
		render(
			<Button data-testid="custom-button" type="submit">
				Submit
			</Button>,
		);

		const button = screen.getByTestId("custom-button");
		expect(button.getAttribute("type")).toBe("submit");
	});

	it("should forward the ref to the underlying button element", () => {
		const ref = createRef<HTMLButtonElement>();
		render(<Button ref={ref}>Ref button</Button>);

		expect(ref.current).toBeInstanceOf(HTMLButtonElement);
	});
});
