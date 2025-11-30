
async function test() {
    try {
        const id = 1764459863730; // ID from previous step
        const res = await fetch(`http://localhost:3000/api/activities/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Script Test Updated",
                duration: "120",
                cost: "60"
            })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error(e);
    }
}

test();
