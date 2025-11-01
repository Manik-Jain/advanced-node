const express = require('express');
const cluster = require('cluster');
const { Worker } = require('worker_threads');
const path = require('path');

if (cluster.isMaster) {
  const numCPUs = require('os').cpus().length;
  console.log(`Master ${process.pid} is running`);

  // Fork workers for HTTP handling
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  console.log(`Worker ${process.pid} started`);

  const app = express();
  const port = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Create a worker thread pool
  const workerPool = [];
  const maxWorkers = 4; // Adjust based on your needs

  // Initialize worker pool
  for (let i = 0; i < maxWorkers; i++) {
    const worker = new Worker(path.join(__dirname, 'worker.js'));
    workerPool.push(worker);
  }

  let currentWorker = 0;

  // Function to get next available worker (round-robin)
  const getNextWorker = () => {
    const worker = workerPool[currentWorker];
    currentWorker = (currentWorker + 1) % maxWorkers;
    return worker;
  };

  // Sample route that uses a worker thread for CPU-intensive task
  app.get('/compute', (req, res) => {
    const worker = getNextWorker();
    
    worker.once('message', (result) => {
      res.json(result);
    });

    worker.postMessage(req.query.data || {});
  });

  // Basic route
  app.get('/', (req, res) => {
    res.send('Hello, Advanced Node.js!');
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });

  // Cleanup worker threads on process exit
  process.on('exit', () => {
    workerPool.forEach(worker => worker.terminate());
  });
}
