'use server';

import { createClient } from '@libsql/client';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL as string,
    authToken: process.env.TURSO_AUTH_TOKEN as string,
});

// Helper to convert time string (HH:MM or HH:MM:SS) to minutes
function timeToMinutes(timeStr: string) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0] || '0') * 60 + parseInt(parts[1] || '0');
}

// Check if a specific time slot conflicts with existing shoots for a team member
export async function checkTeamConflict(teamMemberId: string, date: string, startTime: string, endTime: string) {
    try {
        // 1. Get all shoots for this day that involve this team member
        // In this schema, team members are linked to shoots via shoot_team table
        const shoots = await client.execute({
            sql: `
                SELECT s.id, s.title, s.start_time, s.end_time 
                FROM shoots s
                JOIN shoot_assignments sa ON s.id = sa.shoot_id
                WHERE sa.member_id = ? AND s.shoot_date = ?
            `,
            args: [teamMemberId, date]
        });

        const reqStart = timeToMinutes(startTime);
        const reqEnd = timeToMinutes(endTime);

        const conflicts = [];
        for (const shoot of shoots.rows) {
            const shootStart = timeToMinutes(shoot.start_time as string);
            const shootEnd = timeToMinutes(shoot.end_time as string);

            // Time overlap logic: (StartA < EndB) and (EndA > StartB)
            if (reqStart < shootEnd && reqEnd > shootStart) {
                conflicts.push({
                    type: 'shoot_conflict',
                    shootId: shoot.id,
                    title: shoot.title,
                    startTime: shoot.start_time,
                    endTime: shoot.end_time
                });
            }
        }

        // 2. Check team member's stated availability block for that day
        const availability = await client.execute({
            sql: `SELECT start_time, end_time, is_unavailable FROM availability WHERE team_member_id = ? AND date = ?`,
            args: [teamMemberId, date]
        });

        for (const avail of availability.rows) {
            if (avail.is_unavailable) {
                const unavailStart = timeToMinutes(avail.start_time as string);
                const unavailEnd = timeToMinutes(avail.end_time as string);
                if (reqStart < unavailEnd && reqEnd > unavailStart) {
                    conflicts.push({
                        type: 'unavailable',
                        startTime: avail.start_time,
                        endTime: avail.end_time
                    });
                }
            }
        }

        return {
            hasConflict: conflicts.length > 0,
            conflicts
        };

    } catch (error) {
        console.error('[Scheduling] Conflict check error:', error);
        return { hasConflict: false, error: 'Failed to check conflicts' };
    }
}

// Core scheduling engine: Suggest 3 best slots within a date range for specified team members
export async function suggestBestSlots(teamMemberIds: string[], durationHours: number, fromDate: string, toDate: string) {
    try {
        console.log(`[Scheduling] Suggesting slots for ${teamMemberIds.length} members between ${fromDate} and ${toDate}`);

        if (teamMemberIds.length === 0) return { slots: [] };

        // Query to get all relevant unavailable blocks and shoots for these members between dates
        const placeholders = teamMemberIds.map(() => '?').join(',');

        const shoots = await client.execute({
            sql: `
                SELECT DISTINCT s.shoot_date, s.start_time, s.end_time 
                FROM shoots s
                JOIN shoot_assignments sa ON s.id = sa.shoot_id
                WHERE sa.member_id IN (${placeholders}) 
                  AND s.shoot_date >= ? AND s.shoot_date <= ?
            `,
            args: [...teamMemberIds, fromDate, toDate]
        });

        const unavailability = await client.execute({
            sql: `
                SELECT date, start_time, end_time 
                FROM availability 
                WHERE is_unavailable = 1 
                  AND member_id IN (${placeholders})
                  AND date >= ? AND date <= ?
            `,
            args: [...teamMemberIds, fromDate, toDate]
        });

        // This is a naive implementation:
        // We'll scan standard working days (Mon-Fri) and standard hours (09:00 - 18:00)
        // within the fromDate-toDate range and look for gaps of durationHours.

        const suggestedSlots = [];
        let currDate = new Date(fromDate);
        const endDateObj = new Date(toDate);

        // Map conflicts by date for quick lookup
        const dailyConflicts: Record<string, { start: number, end: number }[]> = {};

        const addConflict = (dateStr: string, startStr: string, endStr: string) => {
            if (!dailyConflicts[dateStr]) dailyConflicts[dateStr] = [];
            dailyConflicts[dateStr].push({
                start: timeToMinutes(startStr),
                end: timeToMinutes(endStr)
            });
        };

        shoots.rows.forEach((r: any) => addConflict(r.shoot_date as string, r.start_time as string, r.end_time as string));
        unavailability.rows.forEach((r: any) => addConflict(r.date as string, r.start_time as string, r.end_time as string));

        // Scan days
        while (currDate <= endDateObj && suggestedSlots.length < 3) {
            const dateStr = currDate.toISOString().split('T')[0];
            const dayOfWeek = currDate.getDay();

            // Skip weekends for basic suggestion
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                const conflicts = dailyConflicts[dateStr] || [];
                // Sort conflicts by start time
                conflicts.sort((a, b) => a.start - b.start);

                // Standard work day: 9 AM (540 min) to 6 PM (1080 min)
                let dayStart = 9 * 60;
                const dayEnd = 18 * 60;
                const reqDurationMin = durationHours * 60;

                // Simple gap finding logic
                for (const conflict of conflicts) {
                    if (conflict.start - dayStart >= reqDurationMin) {
                        // Found a gap before this conflict!
                        suggestedSlots.push({
                            date: dateStr,
                            startTime: `${String(Math.floor(dayStart / 60)).padStart(2, '0')}:${String(dayStart % 60).padStart(2, '0')}`,
                            endTime: `${String(Math.floor((dayStart + reqDurationMin) / 60)).padStart(2, '0')}:${String((dayStart + reqDurationMin) % 60).padStart(2, '0')}`,
                        });
                        if (suggestedSlots.length >= 3) break;
                    }
                    // Move the dayStart past this conflict
                    dayStart = Math.max(dayStart, conflict.end);
                }

                // Check gap after last conflict till end of day
                if (suggestedSlots.length < 3 && (dayEnd - dayStart >= reqDurationMin)) {
                    suggestedSlots.push({
                        date: dateStr,
                        startTime: `${String(Math.floor(dayStart / 60)).padStart(2, '0')}:${String(dayStart % 60).padStart(2, '0')}`,
                        endTime: `${String(Math.floor((dayStart + reqDurationMin) / 60)).padStart(2, '0')}:${String((dayStart + reqDurationMin) % 60).padStart(2, '0')}`,
                    });
                }
            }
            currDate.setDate(currDate.getDate() + 1);
        }

        return { slots: suggestedSlots };

    } catch (error) {
        console.error('[Scheduling] Suggest slots error:', error);
        return { slots: [], error: 'Failed to suggest slots' };
    }
}

// Get workload heat map data for all team members for the next 30 days
export async function getTeamWorkload() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const futureStr = futureDate.toISOString().split('T')[0];

        // 1. Get all team members
        const { rows: members } = await client.execute('SELECT id, name, role, color FROM team_members');

        // 2. Get shoots in window
        const { rows: shoots } = await client.execute({
            sql: `
                SELECT s.id, s.title, s.shoot_date, sa.member_id as team_member_id 
                FROM shoots s
                JOIN shoot_assignments sa ON s.id = sa.shoot_id
                WHERE s.shoot_date >= ? AND s.shoot_date <= ?
            `,
            args: [todayStr, futureStr]
        });

        // 3. Get assigned project tasks due in window
        const { rows: tasks } = await client.execute({
            sql: `
                SELECT id, title, due_date, assigned_to 
                FROM project_tasks 
                WHERE is_completed = 0 AND due_date >= ? AND due_date <= ? AND assigned_to IS NOT NULL
            `,
            args: [todayStr, futureStr]
        });

        // Calculate load per member per day
        const workload: Record<number, Record<string, { shoots: any[], tasks: any[], score: number }>> = {};

        for (const m of members) {
            workload[m.id as number] = {};
            // Init all 30 days
            let curr = new Date();
            for (let i = 0; i <= 30; i++) {
                const dStr = curr.toISOString().split('T')[0];
                workload[m.id as number][dStr] = { shoots: [], tasks: [], score: 0 };
                curr.setDate(curr.getDate() + 1);
            }
        }

        for (const shoot of shoots) {
            const mId = shoot.team_member_id as number;
            const dStr = shoot.shoot_date as string;
            if (workload[mId] && workload[mId][dStr]) {
                workload[mId][dStr].shoots.push(shoot);
                workload[mId][dStr].score += 3; // Shoots are heavy
            }
        }

        for (const task of tasks) {
            const mId = task.assigned_to as number;
            const dStr = task.due_date as string;
            if (workload[mId] && workload[mId][dStr]) {
                workload[mId][dStr].tasks.push(task);
                workload[mId][dStr].score += 1; // Tasks are lighter
            }
        }

        return { members, workload, startDate: todayStr, endDate: futureStr };

    } catch (error) {
        console.error('[Scheduling] Workload error:', error);
        return { members: [], workload: {}, error: 'Failed' };
    }
}
