import { FiWifi, FiWifiOff } from 'react-icons/fi';
import useWebSocket from '../../../hooks/useWebSocket';

const WebSocketStatus = ({ className = "" }) => {
  const { readyState } = useWebSocket();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {readyState === 1 ? (
        <div className="flex items-center gap-1 text-green-600">
          <FiWifi className="text-sm animate-pulse" />
          <span className="text-xs font-medium">Live</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600">
          <FiWifiOff className="text-sm" />
          <span className="text-xs font-medium">Offline</span>
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;
