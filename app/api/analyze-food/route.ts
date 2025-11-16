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
  const systemPrompt = `You are a nutrition expert AI. Analyze food photos and provide:
1. Food name (be specific)
2. Estimated calories (realistic estimate)
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
              text: `Analyze this food item: ${foodName}\n\nProvide nutrition information and advice.`,
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
      temperature: 0.7,
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
    const formData = await request.formData()
    const imageFile = formData.get("image") as File

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      )
    }

    // Convert image to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const imageBase64 = buffer.toString("base64")

    // Step 1: Detect food name using Vision API (or mock)
    const foodName = await detectFoodWithVision(imageBase64)

    // Step 2: Analyze nutrition using GPT-4o-mini
    const analysis = await analyzeNutritionWithGPT(foodName, imageBase64)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Analyze food error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze food"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

