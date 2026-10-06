import "server-only";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getProducts } from "@/lib/queries";

const MAX_RESULTS = 5;

const schema = z.object({
  query: z
    .string()
    .optional()
    .describe(
      "Product keywords such as 'wireless earphones', 'keyboard' or 'smart watch'. Use plain product words only: no prices, no filler words. Omit to browse everything within the price range.",
    ),
  minPrice: z.number().optional().describe("Minimum price in Indian rupees (INR). Omit if the customer gave no lower limit."),
  maxPrice: z.number().optional().describe("Maximum price in Indian rupees (INR). Use for 'under 3000', 'below 2k', 'budget of 5000'. Omit if there is no upper limit."),
});

// What the UI renders as tappable cards.
const toCard = (p) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image_url: p.image_url,
  category: p.category,
  rating: p.rating,
  review_count: p.review_count,
});

// What the LLM reads.
const toLlm = (p) => ({
  id: p.id,
  name: p.name,
  price_inr: p.price,
  category: p.category,
  rating: p.review_count ? p.rating : null,
  review_count: p.review_count,
  in_stock: p.stock > 0,
  description: p.description,
});

// Returns [text for the LLM, artifact for the UI]. The artifact never goes back to the model.
export const searchProductsTool = tool(
  async ({ query, minPrice, maxPrice }) => {
    const search = query?.trim() || undefined;
    const base = { minPrice, maxPrice, limit: MAX_RESULTS, sort: "rating" };

    // 1) every keyword must match; 2) fall back to any keyword.
    let products = await getProducts({ ...base, search });
    let matchType = "exact";
    if (products.length === 0 && search && search.split(/\s+/).length > 1) {
      products = await getProducts({ ...base, search, matchAny: true });
      matchType = "partial";
    }

    let outsideRange = [];
    if (products.length === 0 && (minPrice !== undefined || maxPrice !== undefined)) {
      // Nothing in the budget: surface the closest products that ignore the price limits.
      outsideRange = await getProducts({ search, limit: 3, sort: "price_asc" });
    }

    const shown = products.length ? products : outsideRange;
    const payload = {
      searched: { query: search ?? null, minPrice: minPrice ?? null, maxPrice: maxPrice ?? null },
      match_type: products.length ? matchType : "none",
      count: products.length,
      products: products.map(toLlm),
      ...(outsideRange.length && {
        note: "No products matched the price range. These similar products are OUTSIDE the requested range.",
        outside_price_range: outsideRange.map(toLlm),
      }),
      ...(!shown.length && { note: "No products matched this search." }),
    };
    return [JSON.stringify(payload), shown.map(toCard)];
  },
  {
    name: "search_products",
    description:
      "Search the ZeeCart catalog for products, optionally within a price range in INR. Use this whenever the customer asks what we sell, wants recommendations, or has a product type or budget in mind. Returns up to 5 matching products.",
    schema,
    responseFormat: "content_and_artifact",
  },
);
