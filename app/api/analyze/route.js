import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export async function POST(request) {
    try {
        const { image, userGoal } = await request.json();
        
        if (!image) {
            return Response.json({ error: 'Imagem nao fornecida' }, { status: 400 });
        }

        const prompt = `Voce e um nutricionista especialista. Analise esta imagem de comida/bebida e retorne APENAS um JSON valido (sem markdown, sem texto extra) com esta estrutura exata:
{
    "identified": true,
    "foodName": "nome do prato ou alimento identificado",
    "items": ["item1", "item2", "item3"],
    "calories": numero total de calorias estimado,
    "protein": gramas de proteina,
    "carbs": gramas de carboidratos,
    "fat": gramas de gordura,
    "fiber": gramas de fibra,
    "nutritionalValue": "Alto" ou "Medio" ou "Baixo",
    "recommendation": "uma frase curta de recomendacao baseada no objetivo: ${userGoal || 'saude geral'}",
    "isHealthy": true ou false baseado no objetivo do usuario
}

Se nao conseguir identificar comida na imagem, retorne:
{
    "identified": false,
    "error": "Nao foi possivel identificar alimentos na imagem"
}

Seja preciso nas estimativas calorias baseado em porcoes visiveis na foto.`;

        console.log('[v0] Sending image to AI, image length:', image.length);

        const result = await generateText({
            model: gateway('openai/gpt-4o'),
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { 
                            type: 'image', 
                            image: image // pass the full data URL directly
                        }
                    ]
                }
            ],
            maxOutputTokens: 1000,
        });
        
        console.log('[v0] AI Response received, length:', result.text?.length);

        // Parse the JSON response
        let analysisData;
        try {
            // Clean the response - remove markdown code blocks if present
            let cleanedText = result.text.trim();
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }
            analysisData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Parse error:', parseError, 'Raw:', result.text);
            return Response.json({ 
                identified: false, 
                error: 'Erro ao processar resposta da IA' 
            });
        }

        return Response.json(analysisData);

    } catch (error) {
        console.error('[v0] API Error:', error.message, error);
        return Response.json({ 
            identified: false, 
            error: 'Erro ao analisar imagem: ' + error.message 
        }, { status: 500 });
    }
}
