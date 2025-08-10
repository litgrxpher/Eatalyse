'use server';
/**
 * @fileOverview An AI agent that identifies food items from an image.
 *
 * - identifyFoodFromImage - A function that handles the food identification process.
 * - IdentifyFoodFromImageInput - The input type for the identifyFoodFromImage function.
 * - IdentifyFoodFromImageOutput - The return type for the identifyFoodFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyFoodFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyFoodFromImageInput = z.infer<typeof IdentifyFoodFromImageInputSchema>;

const IdentifyFoodFromImageOutputSchema = z.object({
  foodItems: z.array(z.string()).describe('A list of food items identified in the image.'),
});
export type IdentifyFoodFromImageOutput = z.infer<typeof IdentifyFoodFromImageOutputSchema>;

export async function identifyFoodFromImage(input: IdentifyFoodFromImageInput): Promise<IdentifyFoodFromImageOutput> {
  return identifyFoodFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyFoodFromImagePrompt',
  input: {schema: IdentifyFoodFromImageInputSchema},
  output: {schema: IdentifyFoodFromImageOutputSchema},
  prompt: `You are an expert food identifier. You will identify the food items present in the image provided.

  Here is the photo of the meal:
  {{media url=photoDataUri}}

  Return a list of strings, where each string is a food item identified in the photo.
  `,
});

const identifyFoodFromImageFlow = ai.defineFlow(
  {
    name: 'identifyFoodFromImageFlow',
    inputSchema: IdentifyFoodFromImageInputSchema,
    outputSchema: IdentifyFoodFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
