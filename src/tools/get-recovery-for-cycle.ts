import { z } from 'zod';
import { type ToolMetadata, type InferSchema } from 'xmcp';
import { WhoopAPIClient } from '../api/whoop-client';

// Define the schema for tool parameters
export const schema = {
  cycleId: z.number().int().positive().describe('The ID of the cycle to retrieve recovery data for'),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: 'get-recovery-for-cycle',
  description: 'Get recovery data for a specific cycle from WHOOP, including recovery score, HRV, and resting heart rate',
  annotations: {
    title: 'Get WHOOP Recovery Data for Cycle',
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function getRecoveryForCycle({ cycleId }: InferSchema<typeof schema>) {
  try {
    const client = WhoopAPIClient.getInstance();
    const recovery = await client.getRecoveryForCycle(cycleId);
    
    // Format the response for better readability
    const formattedResponse = {
      cycle_id: recovery.cycle_id,
      sleep_id: recovery.sleep_id,
      created_at: new Date(recovery.created_at).toLocaleString(),
      updated_at: new Date(recovery.updated_at).toLocaleString(),
      score_state: recovery.score_state,
      ...(recovery.score && {
        recovery_metrics: {
          recovery_score: `${recovery.score.recovery_score}%`,
          user_calibrating: recovery.score.user_calibrating,
        },
        physiological_data: {
          hrv: `${recovery.score.hrv_rmssd_milli.toFixed(1)} ms`,
          resting_heart_rate: `${recovery.score.resting_heart_rate} bpm`,
          ...(recovery.score.spo2_percentage !== undefined && {
            spo2: `${recovery.score.spo2_percentage.toFixed(1)}%`,
          }),
          ...(recovery.score.skin_temp_celsius !== undefined && {
            skin_temp: `${recovery.score.skin_temp_celsius.toFixed(1)}°C / ${(recovery.score.skin_temp_celsius * 9/5 + 32).toFixed(1)}°F`,
          }),
        },
        interpretation: getRecoveryInterpretation(recovery.score.recovery_score),
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

// Helper function to provide interpretation of recovery score
function getRecoveryInterpretation(score: number): string {
  if (score >= 67) {
    return 'Green - Ready for high strain';
  } else if (score >= 34) {
    return 'Yellow - Moderate readiness';
  } else {
    return 'Red - Focus on recovery';
  }
}