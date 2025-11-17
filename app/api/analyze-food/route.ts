import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { MealAnalysis } from "@/types/meal"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Google Cloud Vision API function
async function detectFoodWithVision(imageBase64: string): Promise<string> {
  // If Vision API key is not set, use a mock response
  if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
    // Mock food detection for development
    const mockFoods = [
      "Grilled chicken breast with rice and vegetables",
      "Caesar salad with grilled chicken",
      "Pasta with marinara sauce",
      "Salmon with quinoa and broccoli",
      "Hamburger with french fries",
      "Sushi roll platter",
      "Pizza slice",
      "Stir-fried vegetables with tofu",
    ]
    return mockFoods[Math.floor(Math.random() * mockFoods.length)]
  }

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64,
              },
              features: [
                {
                  type: "LABEL_DETECTION",
                  maxResults: 10,
                },
                {
                  type: "OBJECT_LOCALIZATION",
                  maxResults: 10,
                },
              ],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    if (data.responses && data.responses[0]?.labelAnnotations) {
      // Extract food-related labels
      interface LabelAnnotation {
        score: number
        description: string
      }
      const foodLabels = (data.responses[0].labelAnnotations as LabelAnnotation[])
        .filter((label) => label.score > 0.7)
        .map((label) => label.description)
        .slice(0, 5)
        .join(", ")

      return foodLabels || "Food item detected"
    }

    return "Food item detected"
  } catch (error) {
    console.error("Vision API error:", error)
    // Fallback to mock
    return "Food item detected"
  }
}

// GPT-4o-mini function to analyze nutrition
async function analyzeNutritionWithGPT(foodName: string, imageBase64: string): Promise<MealAnalysis> {
  const systemPrompt = `You are a nutrition expert AI. Analyze the FOOD PHOTO directly and provide accurate information. 

IMPORTANT: 
- Look at the actual image to identify what food is shown
- Ignore any text hints if they don't match what you see in the image
- Be accurate and specific about what you actually see in the photo

Provide:
1. Food name (be specific and accurate based on what you see in the image)
2. Estimated calories (realistic estimate based on portion size visible)
3. Macronutrients in grams:
   - Protein (g)
   - Carbs (g)
   - Fat (g)
4. Personalized nutrition advice (2-3 sentences) about what nutrients might be missing or what would complement this meal well.

Respond ONLY with a JSON object in this exact format:
{
  "foodName": "specific food name",
  "calories": number,
  "macros": {
    "protein": number,
    "carbs": number,
    "fat": number
  },
  "aiAdvice": "2-3 sentences of personalized nutrition advice"
}

Be realistic with estimates. Don't include any other text.`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze the food in this image. Look carefully at what is actually shown in the photo and provide accurate nutrition information. ${foodName ? `(Note: A preliminary detection suggested "${foodName}", but please verify by looking at the actual image.)` : ""}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more accurate identification
    })

    const content = response.choices[0]?.message?.content || "{}"
    const analysis = JSON.parse(content) as MealAnalysis

    // Validate and set defaults if needed
    return {
      foodName: analysis.foodName || foodName,
      calories: analysis.calories || 0,
      macros: {
        protein: analysis.macros?.protein || 0,
        carbs: analysis.macros?.carbs || 0,
        fat: analysis.macros?.fat || 0,
      },
      aiAdvice:
        analysis.aiAdvice ||
        "This meal looks delicious! Consider adding more vegetables for additional fiber and vitamins.",
    }
  } catch (error) {
    console.error("GPT API error:", error)

    // Fallback response
    return {
      foodName: foodName,
      calories: 400,
      macros: {
        protein: 25,
        carbs: 45,
        fat: 15,
      },
      aiAdvice:
        "I've analyzed your meal. For better nutrition, consider adding leafy greens or other vegetables to increase your fiber and vitamin intake.",
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📸 Analyze food API called")
    
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY is not set")
      return NextResponse.json(
        { error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables." },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      console.error("❌ No image file provided")
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      )
    }

    console.log("✅ Image file received:", imageFile.name, imageFile.size, "bytes")

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const imageBase64 = buffer.toString("base64")
    console.log("✅ Image converted to base64, length:", imageBase64.length)

    // Step 1: Detect food name using Vision API (or mock) - this is just a hint
    // GPT-4o-mini will analyze the image directly and may override this
    console.log("🔍 Detecting food with Vision API (or mock)...")
    const foodNameHint = await detectFoodWithVision(imageBase64)
    console.log("✅ Food hint:", foodNameHint)

    // Step 2: Analyze nutrition using GPT-4o-mini (it has vision capabilities)
    // GPT will look at the actual image and provide accurate analysis
    console.log("🤖 Analyzing nutrition with GPT-4o-mini...")
    const analysis = await analyzeNutritionWithGPT(foodNameHint, imageBase64)
    console.log("✅ Analysis complete:", analysis.foodName, analysis.calories, "kcal")

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("❌ Analyze food error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze food"
    
    // Provide more helpful error messages
    if (errorMessage.includes("apiKey") || errorMessage.includes("OPENAI")) {
      return NextResponse.json(
        { error: "OpenAI API key is missing or invalid. Please check your OPENAI_API_KEY environment variable." },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

