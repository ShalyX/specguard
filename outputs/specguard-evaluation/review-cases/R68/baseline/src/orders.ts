export interface Order { id: string; workspaceId: string; status: string; total: number }
export interface Query { workspaceId: string; status?: string; offset?: number; limit?: number }
export function listOrders(orders: Order[], query: Query): Order[] {
  const matching = orders.filter(o => o.workspaceId === query.workspaceId && (!query.status || o.status === query.status));
  return matching.slice(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 20));
}
export function exportOrders(orders: Order[], query: Query): string {
  return serialize(listOrders(orders, query));
}
function serialize(rows: Order[]): string {
  return ['id,status,total', ...rows.map(o => [o.id, o.status, o.total].map(v => '"' + String(v).replaceAll('"', '""') + '"').join(','))].join('\n');
}
