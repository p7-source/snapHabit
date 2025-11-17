// User profile utilities
import { doc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import { UserProfile } from "@/types/user"

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profileDoc = await getDoc(doc(db, "profiles", userId))
    if (!profileDoc.exists()) {
      return null
    }

    const data = profileDoc.data()
    return {
      userId: data.userId,
      goal: data.goal,
      age: data.age,
      gender: data.gender,
      weight: data.weight,
      height: data.height,
      activityLevel: data.activityLevel,
      macroTargets: data.macroTargets,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

