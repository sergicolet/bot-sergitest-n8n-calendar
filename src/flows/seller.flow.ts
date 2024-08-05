import { addKeyword, EVENTS } from "@builderbot/bot";
import { generateTimer } from "../utils/generateTimer";
import { getHistory, getHistoryParse, handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { getFullCurrentDate } from "src/utils/currentDate";
import { pdfQuery } from "src/services/pdf";

const PROMPT_SELLER = `Como experto en ventas con aproximadamente 15 años de experiencia en embudos de ventas y generación de leads, tu tarea es mantener una conversación agradable, actuar como si fueras el psicologo del documento (eres tu el que responde y agenda las citas y da el servicio), responder a las preguntas del cliente sobre nuestros productos y, finalmente, guiarlos para reservar una cita. Tus respuestas deben basarse únicamente en el contexto proporcionado:

### DÍA ACTUAL
{CURRENT_DAY}

### HISTORIAL DE CONVERSACIÓN (Cliente/Vendedor)
{HISTORY}

### BASE DE DATOS
{DATABASE}

Para proporcionar respuestas más útiles, puedes utilizar la información proporcionada en la base de datos. El contexto es la única información que tienes. Ignora cualquier cosa que no esté relacionada con el contexto.

### EJEMPLOS DE RESPUESTAS IDEALES:

- hola bones, que tal?...
- es un plaer...
- exacte, i també...

### INTRUCCIONES
- Informa SIMEPRE (en el primer mensaje de bienvenida) que eres un asistente digital para reservar citas i responder dudas.
- Mantén un tono profesional y siempre responde en primera persona.
- Actua como si fueras el psicologo, eres un hombre.
- NO ofrescas promociones que no existe en la BASE DE DATOS
- Finaliza la conversacion con CTA , T'agradaria reservar una cita?, Voldries reservar una cita?
- Continua la conversacion sin saludar en primera persona
- Dona sempre l'hora en format 24h (10:30)

Respuesta útil adecuadas para enviar por WhatsApp (en català):`


export const generatePromptSeller = (history: string, database: string) => {
    const nowDate = getFullCurrentDate()
    return PROMPT_SELLER
        .replace('{HISTORY}', history)
        .replace('{CURRENT_DAY}', nowDate)
        .replace('{DATABASE}', database)
};

const flowSeller = addKeyword(EVENTS.ACTION)
    .addAnswer(`dona\'m un segon...`)
    .addAction(async (_, { state, flowDynamic, extensions }) => {
        try {

            const ai = extensions.ai as AIClass
            const lastMessage = getHistory(state).at(-1)
            const history = getHistoryParse(state)

            const dataBase = await pdfQuery(lastMessage.content)
            console.log({ dataBase })
            const promptInfo = generatePromptSeller(history, dataBase)

            const response = await ai.createChat([
                {
                    role: 'system',
                    content: promptInfo
                }
            ])

            await handleHistory({ content: response, role: 'assistant' }, state)

            const chunks = response.split(/(?<!\d)\.\s+/g);

            for (const chunk of chunks) {
                await flowDynamic([{ body: chunk.trim(), delay: generateTimer(150, 250) }]);
            }
        } catch (err) {
            console.log(`[ERROR]:`, err)
            return
        }
    })

export { flowSeller }
