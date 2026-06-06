export const CATEGORY_DEFINITIONS = `
Category definitions and disambiguation rules:
- frozen: Products sold in the freezer section. If the product name includes "congelado/a/os/as", it is frozen regardless of the base ingredient (e.g., "gambas congeladas" = frozen, not fish).
- snacks: Ambient-temperature packaged snacks — chips, chocolate bars, cookies, candy. "Patatas fritas" without a frozen qualifier are snacks. Chocolate bars and bags of chips are snacks.
- fruits_veg: Fresh, unprocessed fruits and vegetables from the produce section. "Tomate frito" or "salsa de tomate" are NOT fruits_veg — those are condiments. Only raw, unprocessed produce.
- canned_goods: Preserved foods in cans or jars. Fish "en conserva", "en lata", "en aceite", "en escabeche" or "al natural" are canned_goods, NOT fish. Examples: "atún en aceite" = canned_goods, "sardinas en conserva" = canned_goods.
- condiments: Sauces, oils, vinegars, spices, and cooking preparations. "Tomate frito", "salsa de tomate", "pan rallado", "aceite de oliva" are condiments.
- personal_care: Hygiene and body care products. "Pasta de dientes" and "papel higiénico" are personal_care. "Pasta" alone (without "dientes" or "dental") is food, not personal_care.
- cleaning: Household cleaning products AND kitchen consumables like "papel de cocina" and "papel de aluminio". Detergents, bleach, mops, and kitchen paper all belong here.
- dairy: Includes both animal milk products AND plant-based milk alternatives. "Bebida de avena", "leche de soja", "bebida de almendras" are dairy because Spanish supermarkets shelf them with dairy.
- cereals_pasta: Grains, cereals, flour, and food pasta — "pasta fresca", "pasta integral", "pasta italiana". NOT toothpaste (that is personal_care).
- drinks: All beverages including hot drinks. "Chocolate a la taza" and "cacao soluble" are drinks (not snacks). "Cerveza", "agua", "zumo", "café", "té" are drinks.

Examples of tricky cases:
- "Patatas fritas bolsa 150g" → snacks (chips, ambient temperature)
- "Patatas congeladas para horno" → frozen (frozen qualifier present)
- "Atún en aceite de oliva lata" → canned_goods (preserved fish)
- "Pasta de dientes blanqueadora" → personal_care (toothpaste)
- "Pasta fresca al huevo" → cereals_pasta (food pasta)
- "Papel de cocina 3 rollos" → cleaning (kitchen paper)
- "Bebida de avena sin azúcar" → dairy (plant-based milk)
- "Chocolate a la taza 500g" → drinks (hot drink preparation)
`.trim();
