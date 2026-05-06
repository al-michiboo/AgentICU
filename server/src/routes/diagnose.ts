// routes/diagnose.ts — POST /api/diagnose endpoint

import { Router, Request, Response } from 'express';
import { diagnoseAgent, AgentConfig } from '../engine/diagnosisEngine';

const router = Router();

interface DiagnoseRequestBody {
  agentName?: string;
  agentType?: string;
  modelProvider?: string;
  modelApiKey?: string;
  systemPrompt?: string;
  toolsDefinition?: string;
  agentCode?: string;
  instructions?: string;
}

router.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body as DiagnoseRequestBody;

    if (!body.agentType) {
      return res.status(400).json({
        error: 'agentType is required (chatbot | autonomous | code-agent | research | assistant | multi-agent)',
      });
    }

    const validTypes = ['chatbot', 'autonomous', 'code-agent', 'research', 'assistant', 'multi-agent'];
    if (!validTypes.includes(body.agentType)) {
      return res.status(400).json({
        error: `Invalid agentType. Must be one of: ${validTypes.join(' | ')}`,
      });
    }

    const config: AgentConfig = {
      agentName: body.agentName || 'Unnamed Agent',
      agentType: body.agentType,
      modelProvider: body.modelProvider || 'openai',
      modelApiKey: body.modelApiKey,
      systemPrompt: body.systemPrompt,
      toolsDefinition: body.toolsDefinition,
      agentCode: body.agentCode,
      instructions: body.instructions,
    };

    const result = diagnoseAgent(config);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Diagnosis error:', error);
    return res.status(500).json({
      error: 'Internal server error during diagnosis',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
