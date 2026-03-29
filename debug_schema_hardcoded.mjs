import { createClient } from '@libsql/client';

const client = createClient({
    url: "libsql://defcon-app-defconcorporation-max.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njk1MzM2NzAsImlkIjoiYzY5ODA1NTktNTcyOS00ODc2LTlkZDktZDMyZTNmMTA4YWIwIiwicmlkIjoiMDdlY2FjODItZDdlNy00MTQ5LWIwMjAtZDhmNjk4MjkyZjQ2In0.WSCS01-Jq1AFe1tLlQcbjzpMFWnpzktCXDtovcslJ3dWE8Yi_y3ZN3majSs--1CsIwVYmaopOYljHfLY3WyYAw",
});

async function debug() {
    console.log('--- DATABASE SCHEMA DEBUG ---');
    try {
        for (const table of ['tasks', 'task_subtasks']) {
            console.log(`\nTable: ${table}`);
            const info = await client.execute(`PRAGMA table_info(${table})`);
            console.table(info.rows);
        }
        
        console.log('\n--- FIRST 5 TASKS ---');
        const tasks = await client.execute("SELECT * FROM tasks LIMIT 5");
        console.log(JSON.stringify(tasks.rows, null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

debug();
