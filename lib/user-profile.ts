// User profile utilities
import { getSupabaseClient } from "./supabase"
import { UserProfile } from "@/types/user"

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      userId: data.id,
      goal: data.goal,
      age: data.age,
      gender: data.gender,
      weight: data.weight,
      height: data.height,
      activityLevel: data.activity_level,
      macroTargets: data.macro_targets,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    // Prepare the data for Supabase
    const profileData: any = {
      id: profile.userId,
      goal: profile.goal,
      age: profile.age,
      gender: profile.gender,
      weight: profile.weight,
      height: profile.height,
      activity_level: profile.activityLevel,
      macro_targets: profile.macroTargets,
      updated_at: new Date().toISOString(),
    }

    console.log("💾 Saving profile to Supabase:", JSON.stringify(profileData, null, 2))

    // Try insert first (for new profiles)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profile.userId)
      .maybeSingle()

    let result
    if (!existingProfile) {
      // New profile - insert with created_at
      profileData.created_at = new Date().toISOString()
      console.log("   📝 Inserting new profile...")
      result = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
    } else {
      // Existing profile - update
      console.log("   ✏️ Updating existing profile...")
      result = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', profile.userId)
        .select()
    }

    const { data, error } = result

    if (error) {
      console.error("❌ Error saving user profile:")
      console.error("   Error object:", JSON.stringify(error, null, 2))
      console.error("   Error code:", error?.code)
      console.error("   Error message:", error?.message)
      console.error("   Error details:", error?.details)
      console.error("   Error hint:", error?.hint)
      console.error("   Full error:", error)
      
      // Common error messages
      if (error?.message?.includes("relation") && error?.message?.includes("does not exist")) {
        console.error("   ⚠️ TABLE DOES NOT EXIST! Create the 'profiles' table in Supabase.")
      }
      if (error?.code === "42501" || error?.message?.includes("permission denied")) {
        console.error("   ⚠️ PERMISSION DENIED! Check RLS policies are set correctly.")
      }
      
      return false
    }

    console.log("✅ Profile saved successfully:", data)
    return true
  } catch (error) {
    console.error("❌ Exception saving user profile:", error)
    if (error instanceof Error) {
      console.error("   Error message:", error.message)
      console.error("   Error stack:", error.stack)
    } else {
      console.error("   Error type:", typeof error)
      console.error("   Error value:", error)
    }
    return false
  }
}

