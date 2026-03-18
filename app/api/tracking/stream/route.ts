// app/api/tracking/stream/route.ts
import { NextRequest } from 'next/server';
import { firestoreDataBase } from '@/lib/firebase/firebaseDb';
import type { TableMap, QueryOptions } from '@/lib/firebase/firebaseDb';
import type { DataTypeReturn } from '@/types';

// Stream message types
interface StreamMessage {
  type: 'tracking_update' | 'vehicle_update' | 'heartbeat' | 'initial' | 'error' | 'close';
  data?: any;
  timestamp: number;
  message?: string;
  count?: number;
}

// Type aliases for easier reference
type TrackingData = TableMap['trackings'];
type VehicleData = TableMap['vehicles'];

// Helper to create typed where clauses for tracking
const createTrackingWhereClause = (
  vehicleId?: string | null,
  driverId?: string | null,
  since?: Date
): QueryOptions<'trackings'>['where'] => {
  const clauses: QueryOptions<'trackings'>['where'] = [];

  if (vehicleId) {
    clauses.push({
      field: 'vehicleId',
      operator: '==',
      value: vehicleId
    } as any); // Type assertion needed due to complex conditional types
  }
  
  if (driverId) {
    clauses.push({
      field: 'driverId',
      operator: '==',
      value: driverId
    } as any);
  }

  if (since) {
    clauses.push({
      field: 'timestamp',
      operator: '>=',
      value: since
    } as any);
  }

  return clauses.length > 0 ? clauses : undefined;
};

// Helper to create typed where clauses for vehicles
const createVehicleWhereClause = (
  vehicleId?: string | null,
  since?: Date
): QueryOptions<'vehicles'>['where'] => {
  const clauses: QueryOptions<'vehicles'>['where'] = [];

  if (vehicleId) {
    clauses.push({
      field: 'id',
      operator: '==',
      value: vehicleId
    } as any);
  }

  if (since) {
    clauses.push({
      field: 'updatedAt',
      operator: '>',
      value: since
    } as any);
  }

  return clauses.length > 0 ? clauses : undefined;
};

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get('vehicleId');
    const driverId = searchParams.get('driverId');
    const limitCount = parseInt(searchParams.get('limit') || '50');
    const allVehicles = searchParams.get('all') === 'true';

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    });

    // Track last update timestamps
    let lastTrackingTimestamp = Date.now();
    let lastVehicleTimestamp = Date.now();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let connectionActive = true;
        let intervals: NodeJS.Timeout[] = [];

        // Helper to send SSE messages
        const sendSSEMessage = (message: StreamMessage) => {
          if (!connectionActive) return;
          
          try {
            const formattedMessage = `data: ${JSON.stringify(message)}\n\n`;
            controller.enqueue(encoder.encode(formattedMessage));
          } catch (error) {
            console.error('Failed to send SSE message:', error);
          }
        };

        // Send initial connection message
        sendSSEMessage({
          type: 'initial',
          timestamp: Date.now(),
          message: 'SSE connection established',
        });

        // Heartbeat interval
        const heartbeatInterval = setInterval(() => {
          sendSSEMessage({
            type: 'heartbeat',
            timestamp: Date.now(),
          });
        }, 25000);
        intervals.push(heartbeatInterval);

        // Load initial tracking data
        const loadInitialData = async () => {
          try {
            const whereClauses = createTrackingWhereClause(vehicleId, driverId);
            
            const result = await firestoreDataBase.get<'trackings'>({
              path: 'trackings'
            }, {
              where: whereClauses,
              orderBy: [{ field: 'timestamp', direction: 'desc' }],
              limit: limitCount
            });

            if (result.status === 'success' && result.data) {
              lastTrackingTimestamp = Date.now();
              sendSSEMessage({
                type: 'initial',
                data: result.data,
                timestamp: Date.now(),
                message: `Loaded ${result.data.length} tracking records`,
                count: result.data.length
              });
            } else if (result.status === 'error') {
              sendSSEMessage({
                type: 'error',
                timestamp: Date.now(),
                message: result.message || 'Failed to load initial data'
              });
            }
          } catch (error) {
            console.error('Error loading initial data:', error);
            sendSSEMessage({
              type: 'error',
              timestamp: Date.now(),
              message: error instanceof Error ? error.message : 'Failed to load initial tracking data'
            });
          }
        };

        // Poll for tracking updates
        const pollTrackingUpdates = async () => {
          if (!connectionActive) return;

          try {
            const since = new Date(lastTrackingTimestamp - 5000); // 5-second buffer
            const whereClauses = createTrackingWhereClause(vehicleId, driverId, since);

            const result = await firestoreDataBase.get<'trackings'>({
              path: 'trackings'
            }, {
              where: whereClauses,
              orderBy: [{ field: 'timestamp', direction: 'desc' }],
              limit: 50
            });

            if (result.status === 'success' && result.data && result.data.length > 0) {
              lastTrackingTimestamp = Date.now();
              
              result.data.forEach((tracking: any) => {
                sendSSEMessage({
                  type: 'tracking_update',
                  data: tracking,
                  timestamp: Date.now()
                });
              });
            }
          } catch (error) {
            console.error('Error polling tracking updates:', error);
          }

          // Schedule next poll if still connected
          if (connectionActive) {
            setTimeout(pollTrackingUpdates, 5000); // Poll every 5 seconds
          }
        };

        // Poll for vehicle updates (if requested)
        const pollVehicleUpdates = async () => {
          if (!connectionActive || (!allVehicles && vehicleId)) return;

          try {
            const since = new Date(lastVehicleTimestamp - 5000);
            const whereClauses = createVehicleWhereClause(
              allVehicles ? undefined : vehicleId,
              since
            );

            const result = await firestoreDataBase.get<'vehicles'>({
              path: 'vehicles'
            }, {
              where: whereClauses,
              orderBy: [{ field: 'updatedAt', direction: 'desc' }],
              limit: 20
            });

            if (result.status === 'success' && result.data && result.data.length > 0) {
              lastVehicleTimestamp = Date.now();
              
              result.data.forEach((vehicle: any) => {
                sendSSEMessage({
                  type: 'vehicle_update',
                  data: vehicle,
                  timestamp: Date.now()
                });
              });
            }
          } catch (error) {
            console.error('Error polling vehicle updates:', error);
          }

          // Schedule next poll if still connected
          if (connectionActive) {
            setTimeout(pollVehicleUpdates, 10000); // Poll every 10 seconds
          }
        };

        // Start polling
        await loadInitialData();
        setTimeout(pollTrackingUpdates, 5000);
        if (allVehicles || !vehicleId) {
          setTimeout(pollVehicleUpdates, 10000);
        }

        // Handle client disconnect
        const cleanup = () => {
          if (!connectionActive) return;
          
          connectionActive = false;
          
          // Clear all intervals
          intervals.forEach(interval => clearInterval(interval));
          intervals = [];
          
          // Send closing message
          try {
            sendSSEMessage({
              type: 'close',
              timestamp: Date.now(),
              message: 'Connection closed'
            });
          } catch (e) {
            // Ignore errors during cleanup
          }
          
          // Close the stream
          setTimeout(() => {
            try {
              controller.close();
            } catch (e) {
              // Stream might already be closed
            }
          }, 100);
        };

        // Listen for abort signal
        request.signal.addEventListener('abort', cleanup);
        
        // Send connection established message
        controller.enqueue(encoder.encode(': connected\n\n'));
      },

      cancel() {
        console.log('Stream cancelled by client');
      }
    });

    return new Response(stream, { headers });
    
  } catch (error) {
    console.error('SSE endpoint setup error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to establish tracking stream',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Batch updates endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleIds, driverIds, since, limit = 100 } = body;
    
    // Build where clauses for tracking
    const whereClauses: QueryOptions<'trackings'>['where'] = [];

    if (vehicleIds?.length > 0) {
      if (vehicleIds.length === 1) {
        whereClauses.push({
          field: 'vehicleId',
          operator: '==',
          value: vehicleIds[0]
        } as any);
      } else {
        whereClauses.push({
          field: 'vehicleId',
          operator: 'in',
          value: vehicleIds
        } as any);
      }
    }

    if (driverIds?.length > 0) {
      if (driverIds.length === 1) {
        whereClauses.push({
          field: 'driverId',
          operator: '==',
          value: driverIds[0]
        } as any);
      } else {
        whereClauses.push({
          field: 'driverId',
          operator: 'in',
          value: driverIds
        } as any);
      }
    }

    if (since) {
      whereClauses.push({
        field: 'timestamp',
        operator: '>=',
        value: new Date(since)
      } as any);
    }

    const result = await firestoreDataBase.get<'trackings'>({
      path: 'trackings'
    }, {
      where: whereClauses.length > 0 ? whereClauses : undefined,
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: Math.min(limit, 500)
    });

    return new Response(
      JSON.stringify({
        success: result.status === 'success',
        data: result.status === 'success' ? result.data : [],
        error: result.status === 'error' ? result.message : undefined,
        count: result.status === 'success' && result.data ? result.data.length : 0
      }),
      {
        status: result.status === 'success' ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}