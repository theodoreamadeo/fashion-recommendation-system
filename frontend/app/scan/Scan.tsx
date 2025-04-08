'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { segmentFace } from '../services/apiService';

// Types for the props
interface ScanStatus {
    status: string;
    progress: number;
    estimatedTime: number;
}

interface ScanResult {
    segmentedFaceUrl: string | null;
    skinToneCategory: string | null;
    dominantColor: string | null; 
}

const Scan: React.FC = () => {
    // Refs for the video and canvas elements
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    //States for the scan status and result
    const [cameraActive, setCameraActive] = useState<boolean>(false);
    const [processing, setProcessing] = useState<boolean>(false);
    const [scanStatus, setScanStatus] = useState<ScanStatus>({
        status: 'Ready to scan',
        progress: 0,
        estimatedTime: 0,
    })
    const [scanResult, setScanResult] = useState<ScanResult>({
        segmentedFaceUrl: null,
        skinToneCategory: null,
        dominantColor: null,
    });

    // Function to start the camera
    useEffect (() => {
        if (typeof window !== 'undefined') {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (error) {
            console.error('Error accessing camera: ', error);
            setScanStatus({
                status: 'Camera error',
                progress: 0,
                estimatedTime: 0,
            });
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            setCameraActive(false);
        }
    };

    const captureImage = (): string | null => {
        if (!videoRef.current || !canvasRef.current) {
          return null;
        }
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Get the image data as base64
          return canvas.toDataURL('image/jpeg', 0.9);
        }
        
        return null;
      };

    const startScan = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setProcessing(true);
        setScanResult({
            segmentedFaceUrl: null,
            skinToneCategory: null,
            dominantColor: null,
        })

        // Start scanning animation 
        setScanStatus({
            status: 'Analyzing face',
            progress: 0,
            estimatedTime: 5,
        });

        // Start progress animation 
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            setScanStatus((prevStatus) => ({
                ...prevStatus,
                progress,
                estimatedTime: Math.max (0, 5 - (progress / 20))
            }));

            if (progress >= 90) {
                clearInterval(progressInterval);
            }

        }, 250);

        // Capture the image from the video stream
        try {
            const imageData = captureImage();

            if (!imageData) {
                throw new Error('Failed to capture image from video stream');
            }

            // Send the image to the backend for segmentation
            const result = await segmentFace(imageData);

            // Clear interval and set progress to 100%
            clearInterval(progressInterval);
            if (result.segmentation_status) {
                setScanStatus({
                    status: 'Scan complete',
                    progress: 100,
                    estimatedTime: 0,
                });
                
                // Update UI with results 
                setScanResult({
                    segmentedFaceUrl: result.segmentedFaceUrl,
                    skinToneCategory: result.skinTone?.skinToneColor || null,
                    dominantColor: null, // Placeholder for dominant color, need to recheck 
                });
            } else {
                setScanStatus({
                    status: `Error: ${result.error || 'Unknown error'}`,
                    progress: 100,
                    estimatedTime: 0,
                });
            }
        } catch (error) {
            console.error('Error during scan: ', error);
            clearInterval(progressInterval);
            setScanStatus({
                status: 'Scan failed',
                progress: 100,
                estimatedTime: 0,
            });
        } finally {
            setProcessing(false);
        }
        
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
          {/* Header */}
          <header className="bg-gray-800 text-white px-4 py-2">
            <h1 className="text-lg">Camera</h1>
          </header>
          
          {/* Main Content */}
          <div className="flex flex-1">
            {/* Left Panel - Pose Guide */}
            <div className="w-1/4 bg-white p-5 flex flex-col items-center justify-center text-center">
              <h2 className="text-gray-600 font-medium mb-5">MATCH THIS POSE</h2>
              <div className="w-32 h-64 mb-5">
                <svg viewBox="0 0 100 200" className="w-full h-full">
                  <path d="M50,30 C60,30 70,40 70,50 C70,60 60,70 50,70 C40,70 30,60 30,50 C30,40 40,30 50,30 Z" 
                    fill="none" stroke="#999" strokeWidth="2" />
                  <line x1="50" y1="70" x2="50" y2="120" stroke="#999" strokeWidth="2" />
                  <line x1="50" y1="120" x2="30" y2="160" stroke="#999" strokeWidth="2" />
                  <line x1="50" y1="120" x2="70" y2="160" stroke="#999" strokeWidth="2" />
                  <line x1="50" y1="80" x2="20" y2="100" stroke="#999" strokeWidth="2" />
                  <line x1="50" y1="80" x2="80" y2="100" stroke="#999" strokeWidth="2" />
                </svg>
              </div>
              <p className="text-gray-600">Please stand still, facing forward</p>
            </div>
            
            {/* Center Panel - Camera Feed / Results */}
            <div className="w-1/2 bg-gray-200 flex items-center justify-center relative">
              <div className="relative w-full h-full flex items-center justify-center">
                {scanResult.segmentedFaceUrl && scanStatus.progress === 100 ? (
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="relative w-4/5 h-4/5">
                      <Image 
                        src={scanResult.segmentedFaceUrl} 
                        alt="Segmented Face" 
                        fill
                        className="object-contain rounded-lg shadow-lg"
                      />
                    </div>
                    {scanResult.skinToneCategory && (
                      <div className="mt-4 flex items-center bg-white px-4 py-2 rounded-full shadow">
                        <p className="text-gray-700">Skin Tone: {scanResult.skinToneCategory}</p>
                        {scanResult.dominantColor && (
                          <div 
                            className="ml-3 w-6 h-6 rounded-full border-2 border-white shadow"
                            style={{ backgroundColor: scanResult.dominantColor }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      onLoadedMetadata={() => videoRef.current?.play()}
                      className="max-w-full max-h-full object-contain"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-4 border-2 border-white rounded-lg pointer-events-none"></div>
                  </>
                )}
              </div>
            </div>
            
            {/* Right Panel - Accessories */}
            <div className="w-1/4 bg-white p-5 flex flex-col items-center justify-center text-center">
              <h2 className="text-gray-600 font-medium mb-5">REMOVE FACIAL ACCESSORIES</h2>
              <div className="flex flex-col items-center space-y-5">
                <div className="w-16 h-12">
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <path d="M10,30 C10,20 30,10 50,10 C70,10 90,20 90,30 C90,40 70,50 50,50 C30,50 10,40 10,30 Z" 
                      fill="#999" stroke="none" />
                    <rect x="30" y="25" width="40" height="10" fill="#bbb" />
                  </svg>
                </div>
                <div className="w-16 h-12">
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <circle cx="35" cy="30" r="15" fill="none" stroke="#999" strokeWidth="3" />
                    <circle cx="65" cy="30" r="15" fill="none" stroke="#999" strokeWidth="3" />
                    <line x1="50" y1="30" x2="60" y2="30" stroke="#999" strokeWidth="3" />
                  </svg>
                </div>
                <div className="w-16 h-12">
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <path d="M30,35 C40,25 60,25 70,35 C75,40 75,45 70,50 C60,60 40,60 30,50 C25,45 25,40 30,35 Z" 
                      fill="none" stroke="#999" strokeWidth="3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Panel - Scan Progress */}
          <div className="bg-white p-4 flex flex-col items-center">
            <h2 className="text-gray-600 font-medium mb-2">SCAN PROGRESS</h2>
            <div className="w-4/5 h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-stone-400 transition-all duration-300"
                style={{ width: `${scanStatus.progress}%` }}
              ></div>
            </div>
            <div className="w-4/5 flex justify-between mb-5 text-sm text-gray-600">
              <p>Status: {scanStatus.status}</p>
              <p>Estimated time: {scanStatus.estimatedTime} seconds</p>
            </div>
            
            {!cameraActive ? (
              <button 
                onClick={startCamera}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Start Camera
              </button>
            ) : processing ? (
              <button 
                disabled
                className="px-6 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
              >
                Processing...
              </button>
            ) : scanStatus.progress === 0 ? (
              <button 
                onClick={startScan}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Start Scan
              </button>
            ) : scanStatus.progress === 100 ? (
              <button 
                onClick={startScan}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                Scan Again
              </button>
            ) : (
              <button 
                disabled
                className="px-6 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
              >
                Scanning...
              </button>
            )}
          </div>
        </div>
      );
    };
    
export default Scan;
    



