import dados from '../../config/mandatos.json';
import { mandatosSchema } from './schemas';

// Lê e valida config/mandatos.json. Se o arquivo tiver erro, o build para aqui
// com a mensagem do Zod dizendo qual campo está errado.
export const mandatos = mandatosSchema.parse(dados);
