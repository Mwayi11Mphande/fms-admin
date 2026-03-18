export type DataTypeReturn<T> = { message: string } & ({ status: "success" | "warning", data?: T } | { status: 'error' })
