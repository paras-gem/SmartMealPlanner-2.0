// app/api/recipes/search/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
    // 1. Get the query parameters sent from your frontend
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "healthy";
    const number = searchParams.get("number") || "8";
    
    // 2. Safely extract your key from the backend environment
    const apiKey = process.env.FOOD_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: "Spoonacular API key is not configured in .env.local" }, { status: 500 });
    }

    try {
        // 3. Make the secure request to Spoonacular
        const spoonacularUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=${number}&addRecipeInformation=true&apiKey=${apiKey}`;
        
        const response = await fetch(spoonacularUrl);
        
        if (!response.ok) {
            return NextResponse.json({ error: `Spoonacular responded with status ${response.status}` }, { status: response.status });
        }

        const data = await response.json();

        // 4. Map the Spoonacular fields to fit exactly what your frontend expects
        // (handling fields like readyInMinutes, title, image, calories, etc.)
        const formattedRecipes = (data.results || []).map(recipe => {
            // Find calories from nutrients if available
            const caloriesNutrient = recipe.nutrition?.nutrients?.find(n => n.name === "Calories");
            
            return {
                spoonacularId: recipe.id,
                title: recipe.title,
                image: recipe.image,
                category: recipe.dishTypes?.[0] || "Recipe",
                readyInMinutes: recipe.readyInMinutes || 30,
                calories: caloriesNutrient ? caloriesNutrient.amount : (Math.floor(Math.random() * 300) + 200), // Fallback calorie range if missing
                averageRating: recipe.spoonacularScore ? (recipe.spoonacularScore / 20) : 4.5 // Normalizing a 0-100 score down to a 5-star rating
            };
        });

        // 5. Send it back to your UI matching the structure: result.recipes
        return NextResponse.json({ recipes: formattedRecipes });

    } catch (error) {
        console.error("Backend API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}