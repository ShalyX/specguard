export interface Order { id: string; workspaceId: string; status: string; total: number }
export interface Query { workspaceId: string; status?: string; offset?: number; limit?: number }
export function listOrders(orders: Order[], query: Query): Order[] {
  const matching = orders.filter(o => o.workspaceId === query.workspaceId && (!query.status || o.status === query.status));
  return matching.slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 20));
}
