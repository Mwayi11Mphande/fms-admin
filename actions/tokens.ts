"use server"

import { createCacheActions } from "@/lib/firebase/cachedDatabase"
import { TokenDataBaseSchema } from "@/lib/firebase/firebaseDb"
import { verificationSchema } from "@/schema/verificationSchema"
import z from "zod"


const users = createCacheActions('tokens')

export const getAllTokens = async () => {
    const allUsers = await users
    return allUsers.getAll()
}

export const createToken = async (data: z.infer<typeof verificationSchema>) => {
    const user = (await users).create(data as TokenDataBaseSchema )
    return user
}

export const getTokenById = async (id: string) => {
    const user = (await users).getById(id)
    return user
}
export const updateToken = async (id: string, data: z.infer<typeof verificationSchema>) => {
    const user = (await users).update(id, data as TokenDataBaseSchema )
    return user
}

export const deleteToken = async (id: string,) => {
    const user = (await users).remove(id)
    return user
}

