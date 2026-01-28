import { useState, useCallback } from 'react';

interface GeneratePromptOptions {
  pageContent: string | null;
  featureTitle: string;
  existingFeatures: string[];
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

      if (!response.body) {
        onError("No response body received");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line as data arrives
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1); // handle CRLF
          if (line.startsWith(":") || line.trim() === "") continue; // SSE comments/keepalive
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              onDelta(content);
            }
          } catch {
            // Incomplete JSON split across chunks: put it back and wait for more data
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush in case remaining buffered lines arrived without trailing newline
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch { 
            /* ignore partial leftovers */ 
          }
        }
      }

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
