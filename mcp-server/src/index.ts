import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { registerCatalogTools } from './tools/catalog.js'
import { registerShoppingTools } from './tools/shopping.js'
import { registerSessionTools } from './tools/session.js'
import { registerPantryTools } from './tools/pantry.js'

const server = new McpServer({
  name: 'family-track-mcp',
  version: '1.0.0',
})

registerCatalogTools(server)
registerShoppingTools(server)
registerSessionTools(server)
registerPantryTools(server)

const transport = new StdioServerTransport()
await server.connect(transport)
