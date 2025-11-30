
async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "Script Test",
                description: "Desc",
                duration: "90",
                address: "Script St",
                cost: "50",
                included_in_pass: true
            })
        });
        const data = await res.json();
        console.log('Response:', data);
    } catch (e) {
        console.error(e);
    }
}

test();
