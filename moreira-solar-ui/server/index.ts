import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { env } from './lib/env';
import { registerAuthRoutes } from './routes/auth';
import { registerUserRoutes } from './routes/users';
import { registerClientesRoutes } from './routes/clientes';
import { registerPermissoesRoutes } from './routes/permissoes';
import { registerProjetosRoutes } from './routes/projetos';
import { registerPropostasRoutes } from './routes/propostas';
import { registerOrcamentosRoutes } from './routes/orcamentos';
import { registerLeadsRoutes } from './routes/leads';
import { registerKanbanRoutes } from './routes/kanban';
import { registerFaturasRoutes } from './routes/faturas';
import { registerCobrancasRoutes } from './routes/cobrancas';
import { registerUploadRoutes } from './routes/upload';
import { registerChamadosRoutes } from './routes/chamados';
import { registerEquipamentosRoutes } from './routes/equipamentos';
import { registerParametrosRoutes } from './routes/parametros';
import { registerTitularesRoutes } from './routes/titulares';
import { registerVendedoresRoutes } from './routes/vendedores';
import { registerVinculosRoutes } from './routes/vinculos';
import { registerIntegracoesRoutes } from './routes/integracoes';
import { registerUnidadesRoutes } from './routes/unidades';
import { registerAdminRoutes } from './routes/admin';
import { registerAuthLocalRoutes } from './routes/auth_local';

const app = Fastify({ logger: true });

// Security/cors: allow same-origin in dev via Vite proxy
await app.register(cors, {
  origin: (origin, cb) => cb(null, true),
  credentials: true,
});

await app.register(cookie, {
  secret: env.SESSION_SECRET,
  hook: 'onRequest',
});

app.get('/api/health', async () => ({ ok: true }));

registerAuthRoutes(app);
registerUserRoutes(app);
registerClientesRoutes(app);
registerPermissoesRoutes(app);
registerProjetosRoutes(app);
registerPropostasRoutes(app);
registerOrcamentosRoutes(app);
registerLeadsRoutes(app);
registerKanbanRoutes(app);
registerFaturasRoutes(app);
registerCobrancasRoutes(app);
registerUploadRoutes(app);
registerChamadosRoutes(app);
registerEquipamentosRoutes(app);
registerParametrosRoutes(app);
registerTitularesRoutes(app);
registerVendedoresRoutes(app);
registerVinculosRoutes(app);
registerIntegracoesRoutes(app);
registerUnidadesRoutes(app);
registerAdminRoutes(app);
registerAuthLocalRoutes(app);

const port = Number(env.PORT || 4000);
app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`BFF listening on http://localhost:${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
