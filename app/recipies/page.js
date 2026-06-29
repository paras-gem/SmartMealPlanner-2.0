// app/recipes/page.jsx

async function getSpoonacularRecipes() {
  const apiKey = process.env.FOOD_API_KEY;
  
  // We are searching for "pasta" recipes. You can change this to anything!
  const url = `https://api.spoonacular.com/recipes/complexSearch?query=pasta&number=5&apiKey=${apiKey}`;

  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error('Failed to fetch recipes from Spoonacular');
  }

  return res.json();
}

export default async function RecipesPage() {
  const data = await getSpoonacularRecipes();
  
  // Spoonacular returns recipes inside an array called 'results'
  const recipes = data.results || [];

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Spoonacular Recipe Results</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {recipes.map((recipe) => (
          <div key={recipe.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            {/* Display the recipe image */}
            <img 
              src={recipe.image} 
              alt={recipe.title} 
              style={{ width: '100%', borderRadius: '4px', height: '150px', objectFit: 'cover' }} 
            />
            {/* Display the recipe title */}
            <h2 style={{ fontSize: '18px', marginTop: '12px' }}>{recipe.title}</h2>
          </div>
        ))}
      </div>
    </main>
  );
}