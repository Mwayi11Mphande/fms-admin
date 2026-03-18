import z from "zod";

export const verificationSchema = z.object({
    link: z.string(),

})