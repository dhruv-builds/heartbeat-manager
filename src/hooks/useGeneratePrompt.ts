import { useState, useCallback } from 'react';

interface GeneratePromptOptions {
  pageContent: string | null;
  featureTitle: string;
  existingFeatures: string[];
  attachedImage?: string | null;
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function useGeneratePrompt() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePrompt = useCallback(async ({
    pageContent,
    featureTitle,
    existingFeatures,
    attachedImage,
    onDelta,
    onDone,
    onError,
  }: GeneratePromptOptions) => {
    setIsGenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-feature-prompt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            pageContent,
            featureTitle,
            existingFeatures,
            attachedImage,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          onError("Rate limit exceeded. Please try again in a moment.");
          return;
        }
        
        if (response.status === 402) {
          onError("Perplexity API credits exhausted. Please check your account.");
          return;
        }
        
        onError(errorData.error || `Request failed with status ${response.status}`);
        return;
      }

      const data = await response.json();

      // Perplexity non-streaming format: choices[0].message.content
      const generatedText = data.choices?.[0]?.message?.content;

      if (!generatedText) {
        onError("No content received from AI");
        return;
      }

      // Call onDelta once with the full generated text
      onDelta(generatedText);
      onDone();
    } catch (error) {
      console.error("Generate prompt error:", error);
      onError(error instanceof Error ? error.message : "Failed to generate prompt");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generatePrompt, isGenerating };
}
