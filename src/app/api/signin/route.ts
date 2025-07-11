import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Validate email presence
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    // Trim and validate email format
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return NextResponse.json(
        {
          error: "Email cannot be empty",
        },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address",
        },
        { status: 400 }
      );
    }

    // Check if user exists in our users table
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", trimmedEmail)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError);
      return NextResponse.json(
        {
          error: "Server error. Please try again later.",
        },
        { status: 500 }
      );
    }

    let user = existingUser;

    // If user doesn't exist, create new user
    if (!user) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            email: trimmedEmail,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Error creating user:", insertError);
        return NextResponse.json(
          {
            error: "Failed to create user. Please try again.",
          },
          { status: 500 }
        );
      }

      user = newUser;
    }

    return NextResponse.json({
      user,
      message: "Welcome to AceChat!",
    });
  } catch (error) {
    console.error("Error in sign-in API:", error);
    return NextResponse.json(
      {
        error: "Server error. Please try again later.",
      },
      { status: 500 }
    );
  }
}
