# Ping Tracker Web App

The Ping Tracker web app is a simple application that allows users to send messages and view them in real-time. It provides three methods to send messages: POST, GET, and WebSocket.

## Features

- **Real-time Updates:** Messages are displayed in real-time as they are sent by users.
- **Message Types:** Messages can be sent using three different methods: POST, GET, and WebSocket.
- **Client IP Address:** The app captures and displays the client's IP address.

## Getting Started

1. **Install Dependencies:** Ensure you have Node.js and npm installed on your system.

2. **Install Packages:** Run `npm install` to install the required dependencies.

3. **Start the Server:** Use `npm start` to launch the server.

4. **Access the App:** Open your web browser and go to `http://localhost:3000`.

## Usage

1. **Sending Messages:**
   - **POST Request:** Send a message using a POST request to `http://localhost:3000/ping`.
   - **GET Request:** Send a message using a GET request to `http://localhost:3000/ping?message=YOUR_MESSAGE`.
   - **WebSocket:** Connect to the WebSocket at `http://localhost:3000` and use the "ping" event to send messages.

2. **Viewing Messages:**
   - Messages are displayed on the web page in real-time.

## Customization

- **Message Limit:** The app limits messages to 2048 characters.
- **Maximum Messages:** Only the last 10 messages are retained.

## Additional Notes

- If you are using a reverse proxy (e.g., Cloudflare), ensure to correctly retrieve the client's IP address as specified in the code.
