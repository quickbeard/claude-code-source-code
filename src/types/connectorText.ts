// Stub for connector text types
// This is an internal feature not available in external builds

export interface ConnectorTextBlock {
  type: 'connector_text'
  connector_text: string
}

export interface ConnectorTextDelta {
  type: 'connector_text_delta'
  connector_text: string
}

export function isConnectorTextBlock(block: unknown): block is ConnectorTextBlock {
  return (
    typeof block === 'object' &&
    block !== null &&
    'type' in block &&
    (block as { type: string }).type === 'connector_text'
  )
}

export function isConnectorTextDelta(delta: unknown): delta is ConnectorTextDelta {
  return (
    typeof delta === 'object' &&
    delta !== null &&
    'type' in delta &&
    (delta as { type: string }).type === 'connector_text_delta'
  )
}
