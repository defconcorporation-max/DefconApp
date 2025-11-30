<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700 text-white">
    <h1 className="text-5xl font-bold mb-8">Travel Agency App</h1>
    <div className="flex gap-4">
        <a href="/dashboard" className="px-6 py-3 bg-white text-primary-900 rounded-lg font-semibold hover:bg-primary-50 transition">Agent Login</a>
    </div>
</div>
);

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/dashboard/client/:id" element={<ClientDetails />} />
            <Route path="/client/:id" element={<ClientView />} />
            <Route path="/view/:id" element={<ClientView />} />
            <Route path="*" element={
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-900 text-slate-900 dark:text-white">
                    <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                    <p className="mb-8 text-slate-500 dark:text-slate-400">The page you are looking for does not exist.</p>
                    <a href="/" className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition">Go Home</a>
                </div>
            } />
        </Routes>
    );
}

export default App;
