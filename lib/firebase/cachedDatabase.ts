"use server";
import { revalidateTag, unstable_cache } from "next/cache";
import {
    TableNames
    ,
    firestoreDataBase as db,

    TableMap as TableTypeMap,
    QueryOptions,
} from "./firebaseDb";
import { retainer } from "@/lib/utils";
import { DataTypeReturn as TypeReturn } from "@/types";

/**
 * Configuration for cache behavior
 */
interface CacheConfig {
    duration: number;
    enabled?: boolean;
}

/**
 * Cache defaults
 */
const DEFAULT_CACHE_CONFIG: Record<string, CacheConfig> = {
    getAll: { duration: 60 * 60 * 24, enabled: true },
    getById: { duration: 60 * 60 * 24, enabled: true },
    search: { duration: 60 * 60 * 12, enabled: true },
    count: { duration: 60 * 60 * 6, enabled: true },
};

/**
 * Factory that generates typed server actions for a collection
 */
export async function createCacheActions<T extends TableNames>(
    collectionName: T,
    cachePrefix: string = collectionName,
    config: typeof DEFAULT_CACHE_CONFIG = DEFAULT_CACHE_CONFIG
) {
    const tags = {
        ALL: `${cachePrefix}:all`,
        BY_ID: `${cachePrefix}:by-id`,
        SEARCH: `${cachePrefix}:search`,
        COUNT: `${cachePrefix}:count`,
    } as const;

    async function invalidateAllCaches() {
        try {
            await Promise.all([
                revalidateTag(tags.ALL),
                revalidateTag(tags.BY_ID),
                revalidateTag(tags.SEARCH),
                revalidateTag(tags.COUNT),
            ]);
        } catch (error) {
            console.warn(`Failed to invalidate caches for ${collectionName}`, error);
        }
    }

    async function invalidateCacheTags(...cacheTags: string[]) {
        try {
            await Promise.all(cacheTags.map((t) => revalidateTag(t)));
        } catch (error) {
            console.warn("Failed to invalidate cache tags:", error);
        }
    }

    // ====== CRUD & Queries ======

    async function getAll(
        options?: QueryOptions<T>
    ): Promise<TypeReturn<TableTypeMap[T][] | null>> {
        const fetchFn = async (): Promise<TypeReturn<TableTypeMap[T][] | null>> => {
            try {
                const response = await db.get<T>({ path: collectionName }, options);
                return await retainer<TableTypeMap[T][] | null>(response);
            } catch (err) {
                return {
                    status: "error",
                    message: `Failed to retrieve ${collectionName}: ${err instanceof Error ? err.message : "Unknown error"
                        }`,
                };
            }
        };

        if (!config.getAll.enabled) return fetchFn();

        return unstable_cache(
            fetchFn,
            [`get-all-${cachePrefix}`, JSON.stringify(options || {})],
            {
                tags: [tags.ALL],
                revalidate: config.getAll.duration,
            }
        )();
    }

    async function getById(id: string): Promise<TypeReturn<TableTypeMap[T][]>> {
        if (!id?.trim()) return { status: "error", message: "Document ID required" };

        const fetchFn = async (): Promise<TypeReturn<TableTypeMap[T][]>> => {
            try {
                const response = await db.getById<T>({ path: collectionName, id });

                return await retainer<TableTypeMap[T][]>(
                    response as TypeReturn<TableTypeMap[T][]>
                );
            } catch (err) {
                return {
                    status: "error",
                    message: `Failed to retrieve document: ${err instanceof Error ? err.message : "Unknown error"
                        }`,
                };
            }
        };

        if (!config.getById.enabled) return fetchFn();

        return unstable_cache(fetchFn, [`get-${cachePrefix}-by-id`, id], {
            tags: [tags.BY_ID],
            revalidate: config.getById.duration,
        })();
    }

    async function search<K extends keyof TableTypeMap[T]>(
        field: K,
        searchTerm: TableTypeMap[T][K],
        options?: Omit<QueryOptions<T>, "orderBy">
    ): Promise<TypeReturn<TableTypeMap[T][] | null>> {
        const fetchFn = async (): Promise<TypeReturn<TableTypeMap[T][] | null>> => {
            try {
                const response = await db.search<T, K>(
                    { path: collectionName },
                    field,
                    searchTerm,
                    options
                );
                return await retainer<TableTypeMap[T][] | null>(response);
            } catch (err) {
                return {
                    status: "error",
                    message: `Search failed: ${err instanceof Error ? err.message : "Unknown error"
                        }`,
                };
            }
        };

        if (!config.search.enabled) return fetchFn();

        return unstable_cache(
            fetchFn,
            [
                `search-${cachePrefix}`,
                String(field),
                String(searchTerm),
                JSON.stringify(options || {}),
            ],
            { tags: [tags.SEARCH], revalidate: config.search.duration }
        )();
    }

    async function count(
        options?: Omit<
            QueryOptions<T>,
            "limit" | "startAfter" | "startAt" | "endBefore" | "endAt"
        >
    ): Promise<TypeReturn<number>> {
        const fetchFn = async (): Promise<TypeReturn<number>> => {
            try {
                const c = await db.count<T>({ path: collectionName }, options);
                return { status: "success", message: "Count retrieved", data: c };
            } catch (err) {
                return {
                    status: "error",
                    message: `Count failed: ${err instanceof Error ? err.message : "Unknown error"
                        }`,
                };
            }
        };

        if (!config.count.enabled) return fetchFn();

        return unstable_cache(
            fetchFn,
            [`count-${cachePrefix}`, JSON.stringify(options || {})],
            {
                tags: [tags.COUNT],
                revalidate: config.count.duration,
            }
        )();
    }

    async function create(
        data: TableTypeMap[T]
    ): Promise<TypeReturn<{ id: string }>> {
        try {
            const result = await db.create<T>({ path: collectionName }, data);
            if (result.status === "success" || result.status === "warning") {
                await invalidateAllCaches();
            }
            return result;
        } catch (err) {
            return {
                status: "error",
                message: `Create failed: ${err instanceof Error ? err.message : "Unknown error"
                    }`,
            };
        }
    }

    async function update(
        id: string,
        data: TableTypeMap[T]
    ): Promise<TypeReturn<{ id: string }>> {
        if (!id?.trim()) return { status: "error", message: "Document ID required" };

        try {
            const result = await db.update<T>(
                { path: collectionName, id },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data as any
            );
            if (result.status === "success" || result.status === "warning") {
                await invalidateAllCaches();
            }
            return result;
        } catch (err) {
            return {
                status: "error",
                message: `Update failed: ${err instanceof Error ? err.message : "Unknown error"
                    }`,
            };
        }
    }

    async function remove(id: string): Promise<TypeReturn<{ id: string }>> {
        if (!id?.trim()) return { status: "success", message: "Document ID required" };

        try {
            const result = await db.delete({ path: collectionName, id });
            if (result.status === "success" || result.status === "warning") {
                await invalidateAllCaches();
            }
            return result;
        } catch (err) {
            return {
                status: "error",
                message: `Delete failed: ${err instanceof Error ? err.message : "Unknown error"
                    }`,
            };
        }
    }

    return {
        getAll,
        getById,
        search,
        count,
        create,
        update,
        remove,
        invalidateAllCaches,
        invalidateCacheTags,
    };
}