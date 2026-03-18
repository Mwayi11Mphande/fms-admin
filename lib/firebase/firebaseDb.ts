import z from "zod";
import { DataTypeReturn as TypeReturn } from "@/types"
import { db as database } from "./init";
import { verificationSchema } from "@/schema/verificationSchema";
import { DriverSchema } from "@/schema/driverSchema";
import { FuelSchema } from "@/schema/fuelSchema";
import { MaintenanceSchema } from "@/schema/maintenanceSchema";
import { AlertRuleSchema, NotificationSchema } from "@/schema/notificationSchema";
import { ScheduleSchema } from "@/schema/scheduleSchema";
import { GeofenceSchema, TrackingSchema, TripSchema } from "@/schema/trackingSchema";
import { VehicleSchema } from "@/schema/vehicleSchema";
import { userSchema } from "@/schema/userSchema";
import { Firestore } from "firebase-admin/firestore";
import { firestore } from "firebase-admin";

// mandatory fileds for every colloction or table 
type TableMustHave = {
    id: string,
    createdAt: Date,
    updatedAt: Date,
}

export type UserDatabaseSchema = TableMustHave & z.infer<typeof userSchema>
export type DriverDataBaseSchema = TableMustHave & z.infer<typeof DriverSchema>
export type FuelDataBaseSchema = TableMustHave & z.infer<typeof FuelSchema>
export type MaintenanceDataBaseSchema = TableMustHave & z.infer<typeof MaintenanceSchema>
export type NotificationDataBaseSchema = TableMustHave & z.infer<typeof NotificationSchema>
export type ScheduleDataBaseSchema = TableMustHave & z.infer<typeof ScheduleSchema>
export type TrackingDataBaseSchema = TableMustHave & z.infer<typeof TrackingSchema>
export type VehicleDataBaseSchema = TableMustHave & z.infer<typeof VehicleSchema>
export type TokenDataBaseSchema = TableMustHave & z.infer<typeof verificationSchema>
export type GeofenceDatabaseSchema = TableMustHave & z.infer<typeof GeofenceSchema>
export type TripDatabaseSchema = TableMustHave & z.infer<typeof TripSchema>
export type AlertRuleDatabaseSchema = TableMustHave & z.infer<typeof AlertRuleSchema>

// maps an existing type to a table name that will be create in firestore datatbase 
 export type TableMap = {
    users: UserDatabaseSchema,
    drivers: DriverDataBaseSchema,
    fuels: FuelDataBaseSchema,
    maintenances: MaintenanceDataBaseSchema,
    notifications: NotificationDataBaseSchema,
    schedules: ScheduleDataBaseSchema,
    trackings: TrackingDataBaseSchema,
    vehicles: VehicleDataBaseSchema,
    tokens: TokenDataBaseSchema
    geofences: GeofenceDatabaseSchema,
    trips: TripDatabaseSchema,
    alertRules: AlertRuleDatabaseSchema,
}

// extracts all keys in type table names to create a union for table name auto complete  
 export type TableNames = keyof TableMap

// generic query option from firebase 
export interface QueryOptions<T extends keyof TableMap = TableNames> {
    where?: {
        [K in keyof TableMap[T]]: {
            field: K;
            operator: FirebaseFirestore.WhereFilterOp;
            value: TableMap[T][K];
        };
    }[keyof TableMap[T]][];
    orderBy?: {
        field: keyof TableMap[T];
        direction?: "asc" | "desc";
    }[];
    limit?: number;
    startAfter?: FirebaseFirestore.DocumentSnapshot;
    startAt?: FirebaseFirestore.DocumentSnapshot;
    endBefore?: FirebaseFirestore.DocumentSnapshot;
    endAt?: FirebaseFirestore.DocumentSnapshot;
}

export type BuildRefType = {
    path: TableNames;
    id?: string;
    sub?: BuildRefType;
};
class DataBase {
    private db: Firestore
    constructor() {
        this.db = database
    }
    private buildRefOrCollection(
        def: BuildRefType
    ):
        | { type: "doc"; ref: FirebaseFirestore.DocumentReference }
        | { type: "col"; ref: FirebaseFirestore.CollectionReference } {
        let ref:
            | Firestore
            | FirebaseFirestore.DocumentReference
            | FirebaseFirestore.CollectionReference = this.db;
        let current: BuildRefType | undefined = def;

        while (current) {
            // Always go to collection first
            ref = (ref as Firestore | FirebaseFirestore.DocumentReference).collection(
                current.path
            );

            if (current.id) {
                // Doc ref
                ref = (ref as FirebaseFirestore.CollectionReference).doc(current.id);

                // If there's no sub, this is the final document
                if (!current.sub) {
                    return {
                        type: "doc",
                        ref: ref as FirebaseFirestore.DocumentReference,
                    };
                }
            } else {
                // Stop at collection if no ID provided
                return {
                    type: "col",
                    ref: ref as FirebaseFirestore.CollectionReference,
                };
            }

            current = current.sub;
        }

        return { type: "doc", ref: ref as FirebaseFirestore.DocumentReference };
    }

    private buildQuery<T extends keyof TableMap = TableNames>(
        ref: FirebaseFirestore.CollectionReference,
        options?: QueryOptions<T>
    ): FirebaseFirestore.Query {
        let query: FirebaseFirestore.Query = ref;

        if (options) {
            // Add where clauses
            if (options.where) {
                options.where.forEach((w) => {
                    query = query.where(w.field as string, w.operator, w.value);
                });
            }

            // Add orderBy clauses
            if (options.orderBy) {
                options.orderBy.forEach((o) => {
                    query = query.orderBy(o.field as string, o.direction || "asc");
                });
            }

            // Add pagination cursors
            if (options.startAfter) {
                query = query.startAfter(options.startAfter);
            }
            if (options.startAt) {
                query = query.startAt(options.startAt);
            }
            if (options.endBefore) {
                query = query.endBefore(options.endBefore);
            }
            if (options.endAt) {
                query = query.endAt(options.endAt);
            }

            // Add limit
            if (options.limit) {
                query = query.limit(options.limit);
            }
        }

        return query;
    }

    // 🔹 GET operations - Made more flexible with proper typing
    async get<T extends keyof TableMap = TableNames>(
        def: BuildRefType,
        options?: QueryOptions<T>
    ): Promise<TypeReturn<TableMap[T][] | null>> {
        try {
            const { type, ref } = this.buildRefOrCollection(def);

            if (type === "doc") {
                const snap = await ref.get();
                return {
                    status: "success",
                    message: "",
                    data: snap.exists
                        ? ([
                            {
                                id: snap.id,
                                ...snap.data(),
                                createdAt: snap.createTime?.toDate(),
                                updatedAt: snap.updateTime?.toDate(),
                            },
                        ] as TableMap[T][])
                        : null,
                };
            } else {
                const query = this.buildQuery(ref, options);
                const snap = await query.get();
                return {
                    status: "success",
                    message: "",
                    data: snap.docs.map((d) => ({
                        id: d.id,
                        ...d.data(),
                        createdAt: d.createTime?.toDate(),
                        updatedAt: d.updateTime?.toDate(),
                    })) as TableMap[T][],
                };
            }
        } catch (error) {
            return {
                status: "error",
                message:
                    error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    }

    // 🔹 GET single document by ID
    async getById<T extends keyof TableMap = TableNames>(
        def: BuildRefType & Required<Pick<BuildRefType, "id">>
    ): Promise<TypeReturn<TableMap[T][] | null>> {
        try {
            const { type, ref } = this.buildRefOrCollection(def);

            if (type !== "doc") {
                return {
                    status: "error",
                    message: "getById() requires a document path with ID",
                };
            }

            const snap = await ref.get();
            return {
                status: "success",
                message: "",
                data: snap.exists
                    ? ([
                        {
                            id: snap.id,
                            ...snap.data(),
                            createdAt: snap.createTime?.toDate(),
                            updatedAt: snap.updateTime?.toDate(),
                        },
                    ] as TableMap[T][])
                    : null,
            };
        } catch (error) {
            return {
                status: "error",
                message:
                    error instanceof Error ? error.message : "Unknown error occurred",
            };
        }
    }

  
    async create<T extends keyof TableMap = TableNames>(
        def: BuildRefType,
        data: TableMap[T] // Made more flexible since subcollections won't match TableMap
    ): Promise<TypeReturn<{ id: string }>> {
        try {
            const { type, ref } = this.buildRefOrCollection(def);

            if (type !== "col") {
                return {
                    status: "error",
                    message: "create() requires a collection path without ID",
                };
            }

            const timestamp = firestore.FieldValue.serverTimestamp();
            const docData = {
                ...data,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            const docRef = await ref.add(docData);
            return {
                status: "success",
                message: "Document created successfully",
                data: { id: docRef.id },
            };
        } catch (error) {
            return {
                status: "error",
                message:
                    error instanceof Error ? error.message : "Failed to create document",
            };
        }
    }

    async createWithId<T extends keyof TableMap = TableNames>(
        def: BuildRefType,
        data: TableMap[T]
    ): Promise<TypeReturn<{ id: string }>> {
        try {
            const { type, ref } = this.buildRefOrCollection(def);

            if (type !== "doc") {
                return {
                    status: "error",
                    message: "createWithId() requires a document path with ID",
                };
            }

            const timestamp = firestore.FieldValue.serverTimestamp();
            const docData = {
                ...data,
                createdAt: timestamp,
                updatedAt: timestamp,
            };

            await ref.set(docData);
            return {
                status: "success",
                message: "Document created successfully",
                data: { id: ref.id },
            };
        } catch (error) {
            return {
                status: "error",
                message:
                    error instanceof Error ? error.message : "Failed to create document",
            };
        }
    }

    // 🔹 UPDATE operations
    async update<T extends keyof TableMap = TableNames>(
        def: BuildRefType,
        data: TableMap[T]
    ): Promise<TypeReturn<{ id: string }>> {
        try {
            const { type, ref } = this.buildRefOrCollection(def);

            if (type !== "doc") {
                return {
                    status: "error",
                    message: "update() requires a document path with ID",
                };
            }

            const updateData = {
                ...data,
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            await ref.update(updateData);
            return {
                status: "success",
                message: "Document updated successfully",
                data: { id: ref.id },
            };
        } catch (error) {
            return {
                status: "error",
                message:
                    error instanceof Error ? error.message : "Failed to update document",
            };
        }
    }

    async upsert<T extends keyof TableMap = TableNames>(
        def: BuildRefType,
        data: TableMap[T]
    ): Promise<TypeReturn<{ id: string }>> {
        try {
            const { type, ref } = this.buildRefOrCollection(def);

            if (type !== "doc") {
                return {
                    status: "error",
                    message: "upsert() requires a document path with ID",
                };
            }

            const timestamp = firestore.FieldValue.serverTimestamp();
            const upsertData = {
                ...data,
                updatedAt: timestamp,
                createdAt: timestamp, // Will only be set if document doesn't exist
            };

            await ref.set(upsertData, { merge: true });
            return {
                status: "success",
                message: "Document upserted successfully",
                data: { id: ref.id },
            };
        } catch (error) {
            return {
                status: "error",
                message:
                    error instanceof Error ? error.message : "Failed to upsert document",
            };
        }
    }

    // 🔹 DELETE operations
    async delete(def: BuildRefType): Promise<TypeReturn<{ id: string }>> {
        try {
            const { type, ref } = this.buildRefOrCollection(def);

            if (type !== "doc") {
                return {
                    status: "error",
                    message: "delete() requires a document path with ID",
                };
            }

            await ref.delete();
            return {
                status: "success",
                message: "Document deleted successfully",
                data: { id: ref.id },
            };
        } catch (error) {
            return {
                status: "error",
                message:
                    error instanceof Error ? error.message : "Failed to delete document",
            };
        }
    }

    async softDelete(def: BuildRefType): Promise<TypeReturn<{ id: string }>> {
        try {
            const { type, ref } = this.buildRefOrCollection(def);

            if (type !== "doc") {
                return {
                    status: "error",
                    message: "softDelete() requires a document path with ID",
                };
            }

            const softDeleteData = {
                deleted: true,
                deletedAt: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
            };

            await ref.update(softDeleteData);
            return {
                status: "success",
                message: "Document soft deleted successfully",
                data: { id: ref.id },
            };
        } catch (error) {
            return {
                status: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to soft delete document",
            };
        }
    }

    async count<T extends keyof TableMap = TableNames>(
    def: BuildRefType,
    options?: Omit<
      QueryOptions<T>,
      "limit" | "startAfter" | "startAt" | "endBefore" | "endAt"
    >
  ): Promise<number> {
    const { type, ref } = this.buildRefOrCollection(def);

    if (type !== "col") {
      throw new Error("count() requires a collection path");
    }

    const query = this.buildQuery(ref, options);
    const snapshot = await query.count().get();
    return snapshot.data().count;
  }
    // 🔹 SEARCH operations
  async search<
    T extends keyof TableMap = TableNames,
    K extends keyof TableMap[T] = keyof TableMap[T]
  >(
    def: BuildRefType,
    field: K,
    searchTerm: TableMap[T][K],
    options?: Omit<QueryOptions<T>, "orderBy">
  ): Promise<TypeReturn<TableMap[T][] | null>> {
    try {
      const { type, ref } = this.buildRefOrCollection(def);

      if (type !== "col") {
        return {
          status: "error",
          message: "search() requires a collection path",
        };
      }

      // 🔹 Special handling if the field is a string
      if (typeof searchTerm === "string") {
        if (!searchTerm.trim().length) {
          return {
            status: "error",
            message: "Search term cannot be empty",
          };
        }

        const trimmedSearchTerm = searchTerm.trim();
        const endTerm = trimmedSearchTerm.replace(/.$/, (c) =>
          String.fromCharCode(c.charCodeAt(0) + 1)
        );

        let searchQuery: FirebaseFirestore.Query = ref
          .where(field as string, ">=", trimmedSearchTerm)
          .where(field as string, "<", endTerm)
          .orderBy(field as string);

        // Apply query options (no orderBy override allowed)
        if (options) {
          if (options.where) {
            options.where.forEach((w) => {
              searchQuery = searchQuery.where(
                w.field as string,
                w.operator,
                w.value
              );
            });
          }
          if (options.startAfter)
            searchQuery = searchQuery.startAfter(options.startAfter);
          if (options.startAt)
            searchQuery = searchQuery.startAt(options.startAt);
          if (options.endBefore)
            searchQuery = searchQuery.endBefore(options.endBefore);
          if (options.endAt) searchQuery = searchQuery.endAt(options.endAt);

          searchQuery = searchQuery.limit(options.limit || 50);
        } else {
          searchQuery = searchQuery.limit(50);
        }

        const snapshot = await searchQuery.get();

        const results = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.createTime?.toDate(),
          updatedAt: d.updateTime?.toDate(),
        }));

        return {
          status: "success",
          message: `Found ${results.length} results`,
          data: results as TableMap[T][] ,
        };
      }

      // 🔹 Fallback for non-string fields (exact match only)
      let exactQuery: FirebaseFirestore.Query = ref.where(
        field as string,
        "==",
        searchTerm
      );

      if (options) {
        if (options.where) {
          options.where.forEach((w) => {
            exactQuery = exactQuery.where(
              w.field as string,
              w.operator,
              w.value
            );
          });
        }
        if (options.startAfter)
          exactQuery = exactQuery.startAfter(options.startAfter);
        if (options.startAt) exactQuery = exactQuery.startAt(options.startAt);
        if (options.endBefore)
          exactQuery = exactQuery.endBefore(options.endBefore);
        if (options.endAt) exactQuery = exactQuery.endAt(options.endAt);

        exactQuery = exactQuery.limit(options.limit || 50);
      } else {
        exactQuery = exactQuery.limit(50);
      }

      const snapshot = await exactQuery.get();

      const results = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.createTime?.toDate(),
        updatedAt: d.updateTime?.toDate(),
      }));

      return {
        status: "success",
        message: `Found ${results.length} results`,
        data: results as TableMap[T][],
      };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Search failed",
      };
    }
  }
}

export const firestoreDataBase = new DataBase()