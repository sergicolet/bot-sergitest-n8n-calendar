import { addKeyword, EVENTS } from "@builderbot/bot";
import { clearHistory } from "../utils/handleHistory";
import { addMinutes, format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { appToCalendar } from "src/services/calendar";

const DURATION_MEET = process.env.DURATION_MEET ?? 45
const TIME_ZONE = process.env.TZ
/**
 * Encargado de pedir los datos necesarios para registrar el evento en el calendario
 */
const flowConfirm = addKeyword(EVENTS.ACTION).addAction(async (_, { flowDynamic }) => {
    await flowDynamic('Ok, et demanaré algunes dades per agendar!')
    await flowDynamic('Com et dius?')
}).addAction({ capture: true }, async (ctx, { state, flowDynamic, endFlow }) => {

    if (ctx.body.toLocaleLowerCase().includes('cancelar')) {
        clearHistory(state)
        return endFlow(`Com puc ajudar-te?`)

    }
    await state.update({ name: ctx.body })
    await flowDynamic(`Ultima pregunta, com és el teu correu electrònic?`)
})
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, fallBack }) => {

        if (!ctx.body.includes('@')) {
            return fallBack(`Necessito que el correu estigui ben escrit, si us plau`)
        }

        const dateObject = {
            name: state.get('name'),
            email: ctx.body,
            startDate: utcToZonedTime(state.get('desiredDate'), TIME_ZONE),
            endData: utcToZonedTime(addMinutes(state.get('desiredDate'), +DURATION_MEET), TIME_ZONE),
            phone: ctx.from
        }

        await appToCalendar(dateObject)

        clearHistory(state)
        await flowDynamic('Genial, apuntat! Que tinguis un bon dia')
    })

export { flowConfirm }
