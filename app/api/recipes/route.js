import { NextResponse } from "next/server";
import { initDb } from "@/lib/models";

/**
 * Universal multi-stage recipe search using TheMealDB:
 * Stage 1: Search by name (s=)
 * Stage 2: Search by category (c=)
 * Stage 3: Search by main ingredient (i=)
 * Stage 4: Search by area/cuisine (a=)
 * Stage 5: First-letter with strict filter
 */
async function fetchWithFallback(query) {
  const base = "https://www.themealdb.com/api/json/v1/1";

  // Stage 1: name search
  let res = await fetch(`${base}/search.php?s=${encodeURIComponent(query)}`, { next: { revalidate: 60 } });
  let data = await res.json();
  if (data.meals && data.meals.length > 0) return { meals: data.meals, matchedBy: "name" };

  // Stage 2: category search
  res = await fetch(`${base}/filter.php?c=${encodeURIComponent(query)}`, { next: { revalidate: 60 } });
  data = await res.json();
  if (data.meals && data.meals.length > 0) {
    const limited = data.meals.slice(0, 12);
    const detailed = await Promise.all(
      limited.map(async (m) => {
        const r = await fetch(`${base}/lookup.php?i=${m.idMeal}`, { next: { revalidate: 60 } });
        const d = await r.json();
        return d.meals ? d.meals[0] : null;
      })
    );
    return { meals: detailed.filter(Boolean), matchedBy: "category" };
  }

  // Stage 3: ingredient search
  res = await fetch(`${base}/filter.php?i=${encodeURIComponent(query)}`, { next: { revalidate: 60 } });
  data = await res.json();
  if (data.meals && data.meals.length > 0) {
    const limited = data.meals.slice(0, 12);
    const detailed = await Promise.all(
      limited.map(async (m) => {
        const r = await fetch(`${base}/lookup.php?i=${m.idMeal}`, { next: { revalidate: 60 } });
        const d = await r.json();
        return d.meals ? d.meals[0] : null;
      })
    );
    return { meals: detailed.filter(Boolean), matchedBy: "ingredient" };
  }

  // Stage 4: area/cuisine search (e.g. "Indian", "Italian", "Mexican")
  res = await fetch(`${base}/filter.php?a=${encodeURIComponent(query)}`, { next: { revalidate: 60 } });
  data = await res.json();
  if (data.meals && data.meals.length > 0) {
    const limited = data.meals.slice(0, 12);
    const detailed = await Promise.all(
      limited.map(async (m) => {
        const r = await fetch(`${base}/lookup.php?i=${m.idMeal}`, { next: { revalidate: 60 } });
        const d = await r.json();
        return d.meals ? d.meals[0] : null;
      })
    );
    return { meals: detailed.filter(Boolean), matchedBy: "area" };
  }

  // Stage 5: first-letter with strict client-side filter (no generic dumps)
  const firstLetter = query.trim()[0]?.toLowerCase();
  if (firstLetter && /[a-z]/.test(firstLetter)) {
    res = await fetch(`${base}/search.php?f=${firstLetter}`, { next: { revalidate: 60 } });
    data = await res.json();
    if (data.meals && data.meals.length > 0) {
      const lowerQuery = query.toLowerCase();
      const filtered = data.meals.filter(m => {
        const haystack = [m.strMeal, m.strCategory, m.strArea, m.strTags]
          .filter(Boolean).join(" ").toLowerCase();
        return haystack.includes(lowerQuery);
      });
      if (filtered.length > 0) return { meals: filtered.slice(0, 12), matchedBy: "letter-filter" };
    }
  }

  return { meals: [], matchedBy: "none" };
}

function mapMeal(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim() !== "") {
      ingredients.push(`${measure ? measure.trim() : ""} ${ingredient.trim()}`.trim());
    }
  }

  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image: meal.strMealThumb ?? null,
    calories: Math.floor(Math.random() * 400 + 300),
    readyInMinutes: 30,
    cuisineType: meal.strArea ?? null,
    mealType: meal.strCategory ?? null,
    dietLabels: meal.strTags ? meal.strTags.split(",").map(t => t.trim()).filter(Boolean) : [],
    ingredients,
    url: meal.strYoutube ?? meal.strSource ?? null,
    source: "TheMealDB",
  };
}

// ─── GET: Search recipes ──────────────────────────────────────────────────────

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "chicken";

    const { meals, matchedBy } = await fetchWithFallback(query.trim());
    const recipes = meals.map(mapMeal);

    return NextResponse.json({ recipes, count: recipes.length, matchedBy });
  } catch (err) {
    console.error("[Recipes API] Internal error:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: Save a recipe to MongoDB ──────────────────────────────────────────
// Use this endpoint to persist a recipe from TheMealDB into your own database.
// Body: { mealDbId, title, category, area, ingredients, instructions, image, tags, calories }

export async function POST(request) {
  try {
    const body = await request.json();
    const { mealDbId, title, category, area, ingredients, instructions, image, tags, calories, firebaseUID } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const db = await initDb();
    if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    // Build the document — use mealDbId as the unique external key
    const recipeData = {
      title,
      category: category || "All",
      area,
      ingredients: Array.isArray(ingredients)
        ? ingredients.map(i => (typeof i === "string" ? { name: i } : i))
        : [],
      steps: Array.isArray(instructions) ? instructions : [],
      imageURL: image || null,
      tags: tags || [],
      calories: calories || 0,
      scrapedFromWeb: false,
      createdBy: firebaseUID || null,
      createdAt: new Date(),
    };

    // If mealDbId provided, upsert so we don't duplicate
    let recipe;
    if (mealDbId) {
      recipe = await db.Recipe.findOneAndUpdate(
        { mealDbId: String(mealDbId) },
        { $set: { ...recipeData, mealDbId: String(mealDbId) } },
        { upsert: true, new: true }
      );
    } else {
      recipe = await db.Recipe.create(recipeData);
    }

    return NextResponse.json({ success: true, recipe }, { status: 201 });
  } catch (err) {
    console.error("[Recipes POST]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}