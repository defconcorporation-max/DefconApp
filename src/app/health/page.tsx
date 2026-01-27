export default function HealthPage() {
    return (
        <div style={{ padding: 20, fontFamily: 'monospace' }}>
            <h1>System Status: Operational</h1>
            <p>Deployment version: {new Date().toISOString()}</p>
        </div>
    )
}
