import React, { useEffect, useRef } from 'react';
import '../styles/VideoModal.css';

const VideoModal = ({ isOpen, onClose, videoSrc }) => {
  const modalRef = useRef(null);
  const videoRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };x
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const handleClose = () => {
    // Pause video when closing modal
    if (videoRef.current) {
      videoRef.current.pause();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="video-modal-overlay">
      <div className="video-modal-container" ref={modalRef}>
        <div className="video-modal-header">
          <h3>Demo Video</h3>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        <div className="video-modal-body">
          <video 
            ref={videoRef}
            controls 
            autoPlay
            className="demo-video"
            src={videoSrc}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
};

export default VideoModal;