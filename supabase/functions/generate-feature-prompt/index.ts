const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert Technical Product Manager. Your goal is to write a precise, actionable development prompt for an AI coding assistant (like Lovable or Cursor) to build a specific feature.

Input Context:
- Project Context: A raw dump of the current webpage text. Use this to understand the app's current theme, tech stack, and content.
- Completed Features: A list of features already built. Use this to ensure consistency and avoid duplication.
- Target Feature: The title of the feature the user wants to build.
- Visual Reference (Optional): A screenshot or mockup image. Analyze the UI elements, layout, and design patterns shown.

Output Requirements:
- Write a clear, step-by-step prompt that I can paste into an AI builder.
- Focus on technical implementation details (e.g., 'Update the database schema to add X', 'Create a new React component for Y').
- If an image is provided, reference specific visual elements you observe (e.g., 'Match the button style shown in the screenshot', 'Use the layout pattern visible in the mockup').
- Keep it concise but comprehensive. Do not include introductory fluff like 'Here is your prompt'. Just output the prompt itself.`;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageContent, featureTitle, existingFeatures, attachedImage, projectContext } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userPrompt = `
**Project Context (Current Page):**
${pageContent?.slice(0, 8000) || "No page content provided"}
${projectContext ? `\n**Project Vision & Architecture Context:**\n${projectContext.slice(0, 10000)}` : ""}

**Completed Features:**
${existingFeatures?.length ? "- " + existingFeatures.join("\n- ") : "None yet"}

**Target Feature to Build:**
${featureTitle}

Generate a precise, actionable development prompt for this feature.`;

    // Build multimodal message content
    const userMessageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      {
        type: "text",
        text: userPrompt,
      },
    ];

    // Add image if provided
    if (attachedImage) {
      userMessageContent.push({
        type: "image_url",
        image_url: {
          url: attachedImage,
        },
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessageContent },
    ];

    console.log("Calling Lovable AI Gateway for feature:", featureTitle, "with image:", !!attachedImage);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in your workspace settings." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI service error: ${response.status}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
