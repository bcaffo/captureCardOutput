import React, { useState, useEffect, useRef } from 'react';

// --- Constants ---

const RESOLUTIONS = [
  { label: '480p (640x480)', width: 640, height: 480 },
  { label: '720p (1280x720)', width: 1280, height: 720 },
  { label: '1080p (1920x1080)', width: 1920, height: 1080 },
  { label: '4K (3840x2160)', width: 3840, height: 2160 },
];

// --- Helper Components ---

interface DeviceSelectorProps {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({ devices, selectedDeviceId, onChange, disabled }) => (
  <div className="flex-1 min-w-[200px]">
    <label htmlFor="camera-select" className="block mb-2 text-sm font-medium text-gray-300">
      Camera
    </label>
    <select
      id="camera-select"
      value={selectedDeviceId}
      onChange={onChange}
      disabled={disabled || devices.length === 0}
      className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors duration-200"
    >
      {devices.length > 0 ? (
        devices.map((device, index) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${index + 1}`}
          </option>
        ))
      ) : (
        <option>No cameras found</option>
      )}
    </select>
  </div>
);

interface ResolutionSelectorProps {
  selectedResolution: { width: number; height: number; };
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled: boolean;
}

const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({ selectedResolution, onChange, disabled }) => {
  const selectedIndex = RESOLUTIONS.findIndex(
    res => res.width === selectedResolution.width && res.height === selectedResolution.height
  );

  return (
    <div className="flex-1 min-w-[200px]">
      <label htmlFor="resolution-select" className="block mb-2 text-sm font-medium text-gray-300">
        Resolution
      </label>
      <select
        id="resolution-select"
        value={selectedIndex >= 0 ? selectedIndex : ''}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors duration-200"
      >
        {RESOLUTIONS.map((res, index) => (
          <option key={res.label} value={index}>
            {res.label}
          </option>
        ))}
      </select>
    </div>
  );
};


const FullscreenEnterIcon = () => (
  <svg className="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
  </svg>
);

const FullscreenExitIcon = () => (
  <svg className="h-6 w-6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
  </svg>
);

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  hasStream: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoRef, containerRef, hasStream, isFullscreen, onToggleFullscreen }) => (
  <div
    ref={containerRef}
    className="group relative w-full max-w-4xl mx-auto bg-black rounded-lg shadow-2xl resize-both overflow-hidden border-2 border-gray-700 min-h-[240px] min-w-[320px] flex items-center justify-center aspect-video"
  >
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={`w-full h-full object-cover transition-opacity duration-500 ${hasStream ? 'opacity-100' : 'opacity-0'}`}
    >
      Your browser does not support the video tag.
    </video>
    {!hasStream && (
        <div className="absolute text-gray-400">
            Camera feed will appear here
        </div>
    )}
    {hasStream && (
      <button
        onClick={onToggleFullscreen}
        className="absolute bottom-3 right-3 bg-gray-900 bg-opacity-60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 hover:bg-opacity-80 disabled:opacity-0"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
      </button>
    )}
  </div>
);


// --- Main App Component ---

const App: React.FC = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [selectedResolution, setSelectedResolution] = useState(RESOLUTIONS[1]); // Default to 720p
  const [error, setError] = useState<string | null>(null);
  const [hasStream, setHasStream] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getInitialPermissionAndDevices = async () => {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(track => track.stop());

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(
          (device) => device.kind === 'videoinput'
        );
        
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
          setError(null);
        } else {
          setError("No camera devices found.");
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setError("Camera access was denied. Please grant permission in your browser settings and refresh the page.");
          } else {
            setError("Could not access camera devices. Please ensure you have a camera connected and permissions are allowed.");
          }
        } else {
          setError("An unknown error occurred while accessing media devices.");
        }
        console.error("Error accessing media devices.", err);
      }
    };
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      getInitialPermissionAndDevices();
    } else {
      setError("Your browser does not support camera access.");
    }
  }, []);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (selectedDeviceId) {
      const getStream = async () => {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: selectedResolution.width },
            height: { ideal: selectedResolution.height },
          },
        };
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasStream(true);
          }
        } catch (err) {
          setError(`Error starting video stream. Please try another device or check permissions.`);
          console.error("Error starting video stream.", err);
          setHasStream(false);
        }
      };

      getStream();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDeviceId, selectedResolution]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(event.target.value);
  };

  const handleResolutionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const resolutionIndex = parseInt(event.target.value, 10);
    setSelectedResolution(RESOLUTIONS[resolutionIndex]);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto space-y-6 flex flex-col flex-grow">
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Camera Feed Viewer
          </h1>
          <p className="text-md text-gray-400">
            Select your camera and resize the video player.
          </p>
        </header>

        <main className="space-y-6 flex flex-col flex-grow">
          <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row justify-center gap-4">
            <DeviceSelector
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onChange={handleDeviceChange}
              disabled={!!error || devices.length === 0}
            />
            <ResolutionSelector
              selectedResolution={selectedResolution}
              onChange={handleResolutionChange}
              disabled={!!error || devices.length === 0}
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-center" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="flex-grow flex items-center justify-center">
            <VideoPlayer
              videoRef={videoRef}
              containerRef={playerContainerRef}
              hasStream={hasStream && !error}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
