
'use server';

/**
 * @fileOverview Fetches nutritional information for a given food item using the USDA FoodData Central API.
 *
 * - lookupMacroInformation - A function that handles the macro information lookup process.
 * - LookupMacroInformationInput - The input type for the lookupMacroInformation function.
 * - LookupMacroInformationOutput - The return type for the lookupMacroInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LookupMacroInformationInputSchema = z.object({
  foodItem: z.string().describe('The name of the food item to lookup.'),
  servingSize: z.string().describe('The serving size of the food item.'),
});
export type LookupMacroInformationInput = z.infer<typeof LookupMacroInformationInputSchema>;

const LookupMacroInformationOutputSchema = z.object({
  calories: z.number().describe('The number of calories in the food item for the given serving size.'),
  protein: z.number().describe('The amount of protein in grams for the given serving size.'),
  carbs: z.number().describe('The amount of carbohydrates in grams for the given serving size.'),
  fat: z.number().describe('The amount of fat in grams for the given serving size.'),
  fiber: z.number().describe('The amount of fiber in grams for the given serving size.'),
});
export type LookupMacroInformationOutput = z.infer<typeof LookupMacroInformationOutputSchema>;

export async function lookupMacroInformation(
  input: LookupMacroInformationInput
): Promise<LookupMacroInformationOutput> {
  return lookupMacroInformationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'lookupMacroInformationPrompt',
  input: {schema: LookupMacroInformationInputSchema},
  output: {schema: LookupMacroInformationOutputSchema},
  prompt: `You are a nutritional expert. Given a food item and its serving size, you will look up its nutritional information, including calories, protein, carbs, fat, and fiber.  Return the information in JSON format.

Food Item: {{{foodItem}}}
Serving Size: {{{servingSize}}}`,
});

const lookupMacroInformationFlow = ai.defineFlow(
  {
    name: 'lookupMacroInformationFlow',
    inputSchema: LookupMacroInformationInputSchema,
    outputSchema: LookupMacroInformationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
