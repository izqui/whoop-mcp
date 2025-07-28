import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { WhoopAPIClient } from '../api/whoop-client';

// Define the schema for tool parameters
export const schema = {
  limit: z.number().min(1).max(25).default(10).describe('Number of cycles to retrieve (max 25)'),
  days: z.number().min(1).max(30).optional().describe('Number of days to look back (optional, default gets most recent)'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get-recent-cycles',
  description: 'Get recent physiological cycles (days) from WHOOP, including strain and heart rate data',
  annotations: {
    title: 'Get Recent WHOOP Cycles',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getRecentCycles({ limit, days }: InferSchema<typeof schema>) {
  try {
    const client = WhoopAPIClient.getInstance();
    
    // Calculate date range if days specified
    let params: any = { limit };
    if (days) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      params.start = startDate.toISOString();
      params.end = endDate.toISOString();
    }
    
    const response = await client.getCycleCollection(params);
    
    // Format the cycles for better readability
    const formattedCycles = response.records.map(cycle => {
      const startDate = new Date(cycle.start);
      const endDate = cycle.end ? new Date(cycle.end) : null;
      
      return {
        id: cycle.id,
        date: startDate.toLocaleDateString(),
        start_time: startDate.toLocaleString(),
        end_time: endDate ? endDate.toLocaleString() : 'Ongoing',
        is_current: !cycle.end,
        duration_hours: endDate ? 
          ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)).toFixed(1) : 
          'Ongoing',
        score_state: cycle.score_state,
        ...(cycle.score && {
          strain: cycle.score.strain.toFixed(2),
          calories: `${(cycle.score.kilojoule / 4.184).toFixed(0)} kcal`, // Convert kJ to kcal
          kilojoules: cycle.score.kilojoule.toFixed(0),
          avg_heart_rate: `${cycle.score.average_heart_rate} bpm`,
          max_heart_rate: `${cycle.score.max_heart_rate} bpm`,
        }),
      };
    });
    
    const summary = {
      total_cycles: formattedCycles.length,
      date_range: {
        from: formattedCycles[formattedCycles.length - 1]?.date || 'N/A',
        to: formattedCycles[0]?.date || 'N/A',
      },
      ...(formattedCycles.some(c => c.score_state === 'SCORED') && {
        average_strain: (
          formattedCycles
            .filter(c => c.strain)
            .reduce((sum, c) => sum + parseFloat(c.strain!), 0) / 
          formattedCycles.filter(c => c.strain).length
        ).toFixed(2),
      }),
    };
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          summary,
          cycles: formattedCycles,
          has_more: !!response.next_token,
          next_token: response.next_token,
        }, null, 2),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      }],
      isError: true,
    };
  }
}