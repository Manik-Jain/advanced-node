const { parentPort } = require('worker_threads');

// Listen for messages from the main thread
parentPort.on('message', (data) => {
  // This is where you put your CPU-intensive work
  const result = performCPUIntensiveTask(data);

  // Send the result back to the main thread
  parentPort.postMessage(result);
});

// Example CPU-intensive task
function performCPUIntensiveTask(data) {
  // Simulate a CPU-intensive operation
  let result = 0;
  for (let i = 0; i < 1e7; i++) {
    result += i;
  }
  return { input: data, result };
}
