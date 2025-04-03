import express from 'express';
import mqtt from 'mqtt';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const emqxWsUrl = process.env.EMQX_WS_URL || 'ws://localhost:1883/mqtt';

// Camera client IDs
const cameraPublishers = ['Camera1Publisher', 'Camera2Publisher', 'Camera3Publisher'];

// Function to create a subscriber for each camera
const subscribeToCamera = (publisherClientId: string) => {
  console.log(`Setting up subscriber for ${publisherClientId}`);
  
  // Create a unique subscriber ID to avoid conflicts
  const subscriberId = `Subscriber_for_${publisherClientId}_${Date.now()}`;
  
  // Connect to EMQX via WebSocket with reconnection options
  const client = mqtt.connect(emqxWsUrl, {
    clientId: subscriberId,
    clean: true,
    reconnectPeriod: 5000, // Try to reconnect every 5 seconds
    connectTimeout: 30000, // 30 seconds timeout for connection
    keepalive: 60, // Keepalive interval in seconds
    rejectUnauthorized: false
  });
  
  // Extract camera number
  const cameraNumber = publisherClientId.replace('Camera', '').replace('Publisher', '');
  
  // Define the topics to subscribe to
  const topic = `camera/${cameraNumber}`;
  
  // Track connection status
  let isConnected = false;
  let reconnectCount = 0;
  
  client.on('connect', () => {
    isConnected = true;
    reconnectCount = 0;
    console.log(`Subscriber for ${publisherClientId} connected to EMQX`);
    
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Error subscribing to ${topic}:`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  });
  
  client.on('reconnect', () => {
    reconnectCount++;
    console.log(`Attempting to reconnect ${publisherClientId} (attempt #${reconnectCount})`);
  });
  
  client.on('disconnect', () => {
    isConnected = false;
    console.log(`${publisherClientId} disconnected`);
  });
  
  client.on('offline', () => {
    isConnected = false;
    console.log(`${publisherClientId} went offline`);
  });
  
  client.on('message', (topic, message) => {
    console.log(`[${publisherClientId}] Message received on topic ${topic}:`);
    console.log(message.toString());
  });
  
  client.on('error', (err) => {
    console.error(`MQTT client error for ${publisherClientId}:`, err);
    // No need to end the client here as the reconnect logic will handle it
  });
  
  return client;
};

// Create subscribers for each camera
const subscribers = cameraPublishers.map(subscribeToCamera);

// Basic route for health check
app.get('/', (req, res) => {
  res.send('Density Service Running');
});

// Add status route to check MQTT connection status
app.get('/status', (req, res) => {
  const status = {
    service: 'running',
    mqtt: subscribers.map((client, index) => ({
      camera: cameraPublishers[index],
      connected: client.connected,
      reconnecting: client.reconnecting
    }))
  };
  res.json(status);
});

// Start server
const PORT = process.env.PORT_DENSITY || 8086;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Listening for messages from cameras: ${cameraPublishers.join(', ')}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing MQTT connections...');
  subscribers.forEach(client => client.end());
  process.exit();
});


