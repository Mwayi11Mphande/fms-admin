// // lib/services/driver.service.ts
// import { Driver, DriverSchema } from '@/schema/driverSchema';

// const DRIVERS_COLLECTION = 'drivers';

// export class DriverService {
//   // Generate a readable driver ID
//   private static generateDriverId(firstName: string, lastName: string): string {
//     const prefix = 'DRV';
//     const timestamp = Date.now().toString().slice(-4);
//     const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
//     return `${prefix}-${timestamp}-${initials}`;
//   }

//   // Create a new driver with Firebase Auth user
//   static async createDriver(driverData: Partial<Driver>) {
//     try {
//       // Check if email already exists
//       const existingDriver = await this.getDriverByEmail(driverData.email || '');
//       if (existingDriver) {
//         return {
//           success: false,
//           error: 'A driver with this email already exists'
//         };
//       }

//       // Generate custom ID
//       const driverId = DriverService.generateDriverId(
//         driverData.firstName || '',
//         driverData.lastName || ''
//       );

//       // Validate input
//       const validatedData = DriverSchema.parse({
//         ...driverData,
//         id: driverId,
//         createdAt: Timestamp.now(),
//         updatedAt: Timestamp.now()
//       });

//       // Create Firebase Auth user for driver
//       let authUserId: string;
//       try {
//         const userRecord = await auth.createUser({
//           email: validatedData.email,
//           password: this.generateTemporaryPassword(),
//           displayName: `${validatedData.firstName} ${validatedData.lastName}`,
//           disabled: validatedData.employmentStatus === 'inactive' || validatedData.employmentStatus === 'terminated',
//         });
//         authUserId = userRecord.uid;
        
//         // Set custom claims for role-based access
//         await auth.setCustomUserClaims(userRecord.uid, {
//           role: 'driver',
//           driverId: driverId
//         });
//       } catch (authError: any) {
//         console.error('Error creating auth user:', authError);
//         return {
//           success: false,
//           error: `Failed to create authentication user: ${authError.message}`
//         };
//       }

//       // Add authUserId to driver data
//       const driverWithAuth = {
//         ...validatedData,
//         authUserId,
//         driverId // Also store as separate field for easier querying
//       };

//       // Add to Firestore
//       const docRef = db.collection(DRIVERS_COLLECTION).doc(driverId);
//       await docRef.set(driverWithAuth);

//       return {
//         success: true,
//         data: { 
//           id: driverId,
//           ...driverWithAuth,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         },
//         message: 'Driver created successfully',
//         tempPassword: driverData.email ? 'Check logs for temporary password' : undefined
//       };
//     } catch (error: any) {
//       console.error('Error creating driver:', error);
//       return {
//         success: false,
//         error: error.message || 'Failed to create driver'
//       };
//     }
//   }

//   // Get driver by ID
//   static async getDriver(id: string) {
//     try {
//       const docRef = db.collection(DRIVERS_COLLECTION).doc(id);
//       const docSnap = await docRef.get();

//       if (!docSnap.exists) {
//         return {
//           success: false,
//           error: 'Driver not found'
//         };
//       }

//       const data = docSnap.data();
//       const convertedData = convertToPlainObject(data);
      
//       const validatedData = DriverSchema.parse(convertedData);

//       return {
//         success: true,
//         data: validatedData
//       };
//     } catch (error: any) {
//       console.error('Error getting driver:', error);
//       return {
//         success: false,
//         error: error.message || 'Failed to get driver'
//       };
//     }
//   }

//   // Get driver by email
//   static async getDriverByEmail(email: string) {
//     try {
//       const snapshot = await db.collection(DRIVERS_COLLECTION)
//         .where('email', '==', email.toLowerCase())
//         .limit(1)
//         .get();

//       if (snapshot.empty) return null;

//       const doc = snapshot.docs[0];
//       const data = doc.data();
//       return convertToPlainObject(data);
//     } catch (error) {
//       console.error('Error getting driver by email:', error);
//       return null;
//     }
//   }

//   // Get all drivers with filtering and pagination
//   static async getDrivers(filters?: {
//     status?: string;
//     search?: string;
//     page?: number;
//     limit?: number;
//   }) {
//     try {
//       let query: FirebaseFirestore.Query = db.collection(DRIVERS_COLLECTION);

//       // Apply status filter
//       if (filters?.status && filters.status !== 'all') {
//         query = query.where('employmentStatus', '==', filters.status);
//       }

//       // Order by creation date
//       query = query.orderBy('createdAt', 'desc');

//       const querySnapshot = await query.get();
//       let drivers: any[] = [];

//       querySnapshot.forEach((doc) => {
//         const data = doc.data();
//         drivers.push({
//           id: doc.id,
//           ...convertToPlainObject(data)
//         });
//       });

//       // Apply search filter on server side
//       if (filters?.search) {
//         const searchTerm = filters.search.toLowerCase();
//         drivers = drivers.filter(driver =>
//           driver.firstName?.toLowerCase().includes(searchTerm) ||
//           driver.lastName?.toLowerCase().includes(searchTerm) ||
//           driver.email?.toLowerCase().includes(searchTerm) ||
//           driver.phone?.includes(searchTerm) ||
//           driver.licenseNumber?.toLowerCase().includes(searchTerm)
//         );
//       }

//       // Apply pagination
//       const page = filters?.page || 1;
//       const limit = filters?.limit || 10;
//       const startIndex = (page - 1) * limit;
//       const endIndex = startIndex + limit;
//       const paginatedDrivers = drivers.slice(startIndex, endIndex);

//       // Validate each driver
//       const validatedDrivers = paginatedDrivers.map(driver => {
//         try {
//           return DriverSchema.parse(driver);
//         } catch {
//           return driver;
//         }
//       });

//       return {
//         success: true,
//         data: validatedDrivers,
//         pagination: {
//           total: drivers.length,
//           page,
//           limit,
//           totalPages: Math.ceil(drivers.length / limit)
//         }
//       };
//     } catch (error: any) {
//       console.error('Error getting drivers:', error);
//       return {
//         success: false,
//         error: error.message || 'Failed to get drivers'
//       };
//     }
//   }

//   // Update driver
//   static async updateDriver(id: string, driverData: Partial<Driver>) {
//     try {
//       const docRef = db.collection(DRIVERS_COLLECTION).doc(id);
//       const docSnap = await docRef.get();

//       if (!docSnap.exists) {
//         return {
//           success: false,
//           error: 'Driver not found'
//         };
//       }

//       const existingData = docSnap.data();
//       const updateData = {
//         ...driverData,
//         updatedAt: FieldValue.serverTimestamp()
//       };

//       // Validate update data
//       const validatedData = DriverSchema.partial().parse(updateData);

//       // If email is being updated, check for duplicates
//       if (driverData.email && driverData.email !== existingData?.email) {
//         const existingDriver = await this.getDriverByEmail(driverData.email);
//         if (existingDriver) {
//           return {
//             success: false,
//             error: 'A driver with this email already exists'
//           };
//         }
        
//         // Update Firebase Auth email if authUserId exists
//         if (existingData?.authUserId) {
//           await auth.updateUser(existingData.authUserId, {
//             email: driverData.email
//           });
//         }
//       }

//       // Update employment status in Firebase Auth if changed
//       if (driverData.employmentStatus && existingData?.authUserId) {
//         const disabled = driverData.employmentStatus === 'inactive' || 
//                         driverData.employmentStatus === 'terminated';
        
//         await auth.updateUser(existingData.authUserId, {
//           disabled
//         });
//       }

//       await docRef.update(validatedData);

//       // Get updated document
//       const updatedDoc = await docRef.get();
//       const updatedData = convertToPlainObject(updatedDoc.data());

//       return {
//         success: true,
//         data: { id, ...updatedData },
//         message: 'Driver updated successfully'
//       };
//     } catch (error: any) {
//       console.error('Error updating driver:', error);
//       return {
//         success: false,
//         error: error.message || 'Failed to update driver'
//       };
//     }
//   }

//   // Delete driver
//   static async deleteDriver(id: string) {
//     try {
//       const docRef = db.collection(DRIVERS_COLLECTION).doc(id);
//       const docSnap = await docRef.get();

//       if (!docSnap.exists) {
//         return {
//           success: false,
//           error: 'Driver not found'
//         };
//       }

//       const data = docSnap.data();

//       // Delete Firebase Auth user if exists
//       if (data?.authUserId) {
//         try {
//           await auth.deleteUser(data.authUserId);
//         } catch (authError) {
//           console.warn('Could not delete auth user, continuing with driver deletion:', authError);
//         }
//       }

//       await docRef.delete();

//       return {
//         success: true,
//         message: 'Driver deleted successfully'
//       };
//     } catch (error: any) {
//       console.error('Error deleting driver:', error);
//       return {
//         success: false,
//         error: error.message || 'Failed to delete driver'
//       };
//     }
//   }

//   // Update driver status
//   static async updateDriverStatus(id: string, status: Driver['employmentStatus']) {
//     try {
//       const docRef = db.collection(DRIVERS_COLLECTION).doc(id);
//       const docSnap = await docRef.get();

//       if (!docSnap.exists) {
//         return {
//           success: false,
//           error: 'Driver not found'
//         };
//       }

//       const data = docSnap.data();

//       // Update Firebase Auth user status
//       if (data?.authUserId) {
//         const disabled = status === 'inactive' || status === 'terminated';
//         await auth.updateUser(data.authUserId, { disabled });
//       }

//       await docRef.update({
//         employmentStatus: status,
//         updatedAt: FieldValue.serverTimestamp()
//       });

//       return {
//         success: true,
//         message: `Driver status updated to ${status}`
//       };
//     } catch (error: any) {
//       console.error('Error updating driver status:', error);
//       return {
//         success: false,
//         error: error.message || 'Failed to update driver status'
//       };
//     }
//   }

//   // Assign vehicle to driver
//   static async assignVehicleToDriver(driverId: string, vehicleId: string) {
//     return this.updateDriver(driverId, { 
//       assignedVehicleId: vehicleId 
//     });
//   }

//   // Get driver statistics
//   static async getDriverStats() {
//     try {
//       const snapshot = await db.collection(DRIVERS_COLLECTION).get();
//       const drivers: Driver[] = [];

//       snapshot.forEach((doc) => {
//         const data = doc.data();
//         drivers.push(convertToPlainObject(data) as Driver);
//       });

//       const stats = {
//         total: drivers.length,
//         active: drivers.filter(d => d.employmentStatus === 'active').length,
//         inactive: drivers.filter(d => d.employmentStatus === 'inactive').length,
//         on_leave: drivers.filter(d => d.employmentStatus === 'on_leave').length,
//         terminated: drivers.filter(d => d.employmentStatus === 'terminated').length,
//       };

//       return {
//         success: true,
//         data: stats
//       };
//     } catch (error: any) {
//       console.error('Error getting driver stats:', error);
//       return {
//         success: false,
//         error: error.message || 'Failed to get driver statistics'
//       };
//     }
//   }

//   // Generate temporary password
//   private static generateTemporaryPassword(): string {
//     const length = 12;
//     const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
//     let password = "";
//     for (let i = 0; i < length; i++) {
//       password += charset.charAt(Math.floor(Math.random() * charset.length));
//     }
//     return password;
//   }
// }