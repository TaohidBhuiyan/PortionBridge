import { useEffect, useRef } from 'react';
import { useAuthSocket } from '../context/SocketContext';

/**
 * Custom hook for real-time donation tracking
 * Joins donation-specific socket room and listens for updates
 * @param {number} donationId - The donation ID to track
 * @param {Object} callbacks - Callback functions for real-time events
 * @param {Function} callbacks.onStatusUpdate - Called when donation status changes
 * @param {Function} callbacks.onLocationUpdate - Called when volunteer location updates
 * @param {Function} callbacks.onVolunteerAssigned - Called when volunteer is assigned
 */
export function useDonationTracking(donationId, callbacks = {}) {
  const { socket, connected } = useAuthSocket();
  const roomJoinedRef = useRef(false);

  useEffect(() => {
    if (!socket || !connected || !donationId) return;

    // Join donation-specific room
    if (!roomJoinedRef.current) {
      socket.emit('join_donation_tracking', { donationId });
      roomJoinedRef.current = true;
    }

    // Listen for status updates
    const handleStatusUpdate = (data) => {
      callbacks.onStatusUpdate?.(data);
    };

    // Listen for location updates
    const handleLocationUpdate = (data) => {
      callbacks.onLocationUpdate?.(data);
    };

    // Listen for volunteer assignment
    const handleVolunteerAssigned = (data) => {
      callbacks.onVolunteerAssigned?.(data);
    };

    socket.on('donation_status_updated', handleStatusUpdate);
    socket.on('volunteer_location_updated', handleLocationUpdate);
    socket.on('volunteer_assigned', handleVolunteerAssigned);
    socket.on('error', (error) => {
      console.error('Donation tracking socket error:', error);
    });

    // Cleanup: leave room and remove listeners
    return () => {
      socket.off('donation_status_updated', handleStatusUpdate);
      socket.off('volunteer_location_updated', handleLocationUpdate);
      socket.off('volunteer_assigned', handleVolunteerAssigned);
      socket.off('error');
      
      if (roomJoinedRef.current) {
        socket.emit('leave_donation_tracking', { donationId });
        roomJoinedRef.current = false;
      }
    };
  }, [socket, connected, donationId]);

  return { connected };
}

/**
 * Helper function to calculate ETA based on distance and average speed
 * @param {number} distance - Distance in km
 * @param {number} speed - Average speed in km/h (default: 30 for urban areas)
 * @returns {number} Estimated time in minutes
 */
export function calculateETA(distance, speed = 30) {
  if (!distance || distance <= 0) return null;
  const timeInHours = distance / speed;
  const timeInMinutes = Math.round(timeInHours * 60);
  return timeInMinutes;
}

/**
 * Helper function to format ETA as human-readable string
 * @param {number} minutes - ETA in minutes
 * @returns {string} Formatted ETA string
 */
export function formatETA(minutes) {
  if (!minutes || minutes <= 0) return 'Arriving soon';
  if (minutes < 1) return 'Less than a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
