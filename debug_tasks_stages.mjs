import { createClient } from '@libsql/client';

const client = createClient({
    url: "libsql://defcon-app-defconcorporation-max.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk1MzM2NzAsImlkIjoiYzY5ODA1NTktNTcyOS00ODc2LTlkZDktZDMyZTNmMTA4YWIwIiwicmlkIjoiMDdlY2FjODItZDdlNy00MTQ5LWIwMjAtZDhmNjk4MjkyZjQ2In0.WSCS01-Jq1AFe1tLlQcbjzpMFWnpzktCXDtovcslJ3dWE8Yi_y3ZN3majSs--1CsIwVYmaopOYljHfLY3WyYAw",
});

async function debug() {
    try {
        console.log('--- POST PROD PROJECTS ---');
        const proj = await client.execute("SELECT id, status FROM post_prod_projects LIMIT 5");
        console.table(proj.rows);

        console.log('\n--- POST PROD TASKS (STAGES) ---');
        const tasks = await client.execute("SELECT project_id, title, is_completed, order_index FROM post_prod_tasks LIMIT 10");
        console.table(tasks.rows);

        console.log('\n--- FETCHING CURRENT STAGE FOR PROJECT 20 ---');
        const stage = await client.execute({
            sql: "SELECT title FROM post_prod_tasks WHERE project_id = ? AND is_completed = 0 ORDER BY order_index ASC LIMIT 1",
            args: [20]
        });
        console.log('Current stage for Project 20:', stage.rows[0]?.title || 'Done');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debug();
