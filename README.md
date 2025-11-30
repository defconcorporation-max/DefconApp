
## Setup Instructions

Once Node.js is installed, follow these steps to set up the project:

1.  **Install Client Dependencies**
    Open a terminal/command prompt in the `client` folder:
    ```bash
    cd client
    npm install
    ```

2.  **Install Server Dependencies**
    Open a terminal/command prompt in the `server` folder:
    ```bash
    cd server
    npm install
    ```

## Running the Application

You need to run both the backend server and the frontend client simultaneously.

1.  **Start the Backend Server**
    In the `server` terminal:
    ```bash
    npm start
    ```
    The server will start on `http://localhost:3000`.

2.  **Start the Frontend Client**
    In the `client` terminal:
    ```bash
    npm run dev
    ```
    The client will start (usually on `http://localhost:5173`).

## Usage

1.  Open the client URL (e.g., `http://localhost:5173`) in your browser.
2.  Click **Agent Login** to access the Dashboard.
3.  **Add a Client**: Click the "Add Client" button and fill in the details.
4.  **Manage Itinerary**: Click "Manage Itinerary" on a client card.
    -   Add Flights, Hotels, and Activities.
    -   Upload QR codes or images for passes.
5.  **Client View**: Click the "External Link" icon on the dashboard or use the "Client Demo" link to see what the client sees.
