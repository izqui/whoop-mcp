import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { WhoopAPIClient } from '../api/whoop-client';

// Define the schema for tool parameters
export const schema = {
  sleepId: z.string().uuid({
    message: 'Sleep ID must be a valid UUID format (e.g., ecfc6a15-4661-442f-a9a4-f160dd7afae8)'
  }).describe('The UUID of the sleep activity to retrieve'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get-sleep-by-id',
  description: 'Get sleep data for a specific sleep ID from WHOOP',
  annotations: {
    title: 'Get WHOOP Sleep Data by ID',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getSleep({ sleepId }: InferSchema<typeof schema>) {
    try {
      const client = WhoopAPIClient.getInstance();
      const sleep = await client.getSleepById(sleepId);
      
      // Format the response for better readability
      const formattedResponse = {
        id: sleep.id,
        user_id: sleep.user_id,
        date: new Date(sleep.start).toLocaleDateString(),
        start_time: new Date(sleep.start).toLocaleString(),
        end_time: new Date(sleep.end).toLocaleString(),
        duration_hours: ((new Date(sleep.end).getTime() - new Date(sleep.start).getTime()) / (1000 * 60 * 60)).toFixed(2),
        is_nap: sleep.nap,
        score_state: sleep.score_state,
        ...(sleep.score && {
          performance: {
            sleep_performance: `${sleep.score.sleep_performance_percentage}%`,
            sleep_consistency: `${sleep.score.sleep_consistency_percentage}%`,
            sleep_efficiency: `${sleep.score.sleep_efficiency_percentage.toFixed(1)}%`,
            respiratory_rate: `${sleep.score.respiratory_rate.toFixed(1)} breaths/min`,
          },
          sleep_stages: sleep.score.stage_summary ? {
            total_in_bed: `${(sleep.score.stage_summary.total_in_bed_time_milli / (1000 * 60)).toFixed(0)} minutes`,
            awake: `${(sleep.score.stage_summary.total_awake_time_milli / (1000 * 60)).toFixed(0)} minutes`,
            light_sleep: `${(sleep.score.stage_summary.total_light_sleep_time_milli / (1000 * 60)).toFixed(0)} minutes`,
            deep_sleep: `${(sleep.score.stage_summary.total_slow_wave_sleep_time_milli / (1000 * 60)).toFixed(0)} minutes`,
            rem_sleep: `${(sleep.score.stage_summary.total_rem_sleep_time_milli / (1000 * 60)).toFixed(0)} minutes`,
            sleep_cycles: sleep.score.stage_summary.sleep_cycle_count,
            disturbances: sleep.score.stage_summary.disturbance_count,
          } : undefined,
          sleep_needed: sleep.score.sleep_needed ? {
            baseline: `${(sleep.score.sleep_needed.baseline_milli / (1000 * 60 * 60)).toFixed(1)} hours`,
            debt_adjustment: `${(sleep.score.sleep_needed.need_from_sleep_debt_milli / (1000 * 60)).toFixed(0)} minutes`,
            strain_adjustment: `${(sleep.score.sleep_needed.need_from_recent_strain_milli / (1000 * 60)).toFixed(0)} minutes`,
            nap_adjustment: `${(sleep.score.sleep_needed.need_from_recent_nap_milli / (1000 * 60)).toFixed(0)} minutes`,
          } : undefined,
        }),
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(formattedResponse, null, 2),
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