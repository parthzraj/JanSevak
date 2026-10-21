import React from 'react';
import { IssueMapView } from '../map/IssueMapView';

interface MapViewModalProps {
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
  onClose: () => void;
}

/** Interactive MapLibre-powered map showing the issue location with routing. */
export const MapViewModal: React.FC<MapViewModalProps> = (props) => {
  return <IssueMapView {...props} />;
};
