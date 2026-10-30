type AgentData = {
  properties: Array<{ id: string; address: string; type: string }>;
  tenants: Array<{ id: string; name: string; property_id: string }>;
  contracts: Array<{ tenant_id: string; monthly_rent: number }>;
};

/** Allowlist only the fields consumed by agent-command for name/property/rent matching. */
export function buildAgentContext(data: AgentData, categories: string[], today: string) {
  return {
    properties: data.properties.map(({ id, address, type }) => ({ id, address, type })),
    tenants: data.tenants.map(({ id, name, property_id }) => ({ id, name, property_id })),
    contracts: data.contracts.map(({ tenant_id, monthly_rent }) => ({ tenant_id, monthly_rent })),
    categories: categories.map(name => ({ name })),
    today,
  };
}
